const fs = require("fs");
const ts = require("typescript");

/** @typedef {{node: ts.Node, name: ts.Identifier, params: ts.ParameterDeclaration, typeAlias: ts.TypeAliasDeclaration}} MessageDeclaration */

function lowercase(str) {
  return str.charAt(0).toLocaleLowerCase() + str.substr(1);
}

function uppercase(str) {
  return str.charAt(0).toLocaleUpperCase() + str.substr(1);
}

/**
 * @param {string} code
 * @param {string} name
 */
function save(code, name) {
  fs.writeFileSync(`${__dirname}/../src/protocol/gen/${name}`, code);
}

/** @param {{node: ts.Node, commandOrEvent: 'command' | 'event'}} node */
function collect({ node, commandOrEvent }) {
  const qualifier = ts.createQualifiedName(ts.createTypeReferenceNode('Protocol'), node.name);
  const messageDeclarations = getMessageDeclarations({ node, qualifier, commandOrEvent });
  const messageTypesUnion = ts.createTypeAliasDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    uppercase(commandOrEvent),
    undefined,
    ts.createUnionTypeNode(messageDeclarations.map(({ typeAlias }) => ts.createTypeReferenceNode(typeAlias.name))),
  );
  const messageBuilderFns = messageDeclarations.map((messageDeclaration) => {
    const typeName = lowercase(messageDeclaration.name.escapedText);
    return createMessageBuilderFn({ messageDeclaration, typeName });
  });

  const isServerInterface = commandOrEvent === 'command';
  const firstParamType = isServerInterface ? "Server" : "Client";
  const protocolInterface = createProtocolInterface(
    qualifier, 'I' + node.name.escapedText, firstParamType, messageDeclarations);

  const autoGenComment = "/* Auto generated by build/build-protocol.js */";
  const builderCode = [
    autoGenComment,
    messageDeclarations.map(({ typeAlias }) => printNode(typeAlias)).join("\n"),
    printNode(messageTypesUnion),
    messageBuilderFns.map(printNode).join("\n"),
  ].join("\n\n");
  const protocolInterfaceCode = [
    autoGenComment,
    isServerInterface ? `import Server from '../../server/server'` : `import Client from '../../client/client'`,
    printNode(protocolInterface),
  ].join("\n\n");

  return {
    builderCode,
    protocolInterfaceCode,
  };
}

/**
 * @param {{node: ts.Node, qualifier: ts.Node, commandOrEvent: 'command'|'event'}}
 * @return {MessageDeclaration[]}
 */
function getMessageDeclarations({ node, qualifier, commandOrEvent }) {
  const messageDeclarations = [];

  /** @param {ts.Node} n */
  function visit(n) {
    if (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) {
      let nodeWithParams = n;
      if (findNodeByName(n, 'params')) {
        nodeWithParams = findNodeByName(n, 'params');
      }
      const params = createMessageParamsBinding({ messageDeclaration: { node: nodeWithParams, name: n.name }, qualifier, commandOrEvent });
      const typeAlias = createMessageType({ node: n, qualifier, commandOrEvent });
      messageDeclarations.push({ node: n, name: n.name, params, typeAlias });
    } else if (ts.isModuleDeclaration(n) || ts.isModuleBlock(n)) {
      ts.forEachChild(n, visit);
    }
  }

  ts.forEachChild(node, visit);
  return messageDeclarations;
}

/**
 * @param {{qualifier: ts.Node, node: ts.Node, commandOrEvent: 'command' | 'event'}}
 */
function createMessageType({ qualifier, node, commandOrEvent }) {
  /*
    type AdminSetItemMessage = {
      type: "AdminSetItem";
      args: Protocol.Params.AdminSetItem;
    };
  */

  const name = node.name.escapedText;
  const type = ts.createTypeLiteralNode([
    ts.createPropertySignature(
      undefined,
      "type",
      undefined,
      ts.createLiteral(lowercase(name)),
    ),
    ts.createPropertySignature(
      undefined,
      "args",
      undefined,
      ts.createQualifiedName(qualifier, node.name),
    ),
  ]);

  return ts.createTypeAliasDeclaration(
    undefined,
    undefined,
    name + uppercase(commandOrEvent),
    undefined,
    type,
  );
}

/**
 * Create a binding pattern because it makes hover-over IDE signatures more useful
 * when the property names are visibile, as opposed to just "Protocol.Params.Move".
 * @param {{messageDeclaration: MessageDeclaration, qualifier: ts.Node, commandOrEvent: 'command'|'event'}}
 */
function createMessageParamsBinding({ qualifier, messageDeclaration, commandOrEvent }) {
  /*
    { item, ...loc }: ClientToServerProtocol.AdminSetItem
  */
  const elements = [];
  const restElements = [];

  /** @param {ts.Node} n */
  function visit(n) {
    if (ts.isTypeReferenceNode(n) && n.typeName.escapedText === 'Command') {
      ts.forEachChild(n.typeArguments[0], visit);
    } else if (ts.isPropertySignature(n)) {
      elements.push(ts.createBindingElement(
        undefined,
        undefined,
        n.name,
      ));
    } else if (ts.isTypeLiteralNode(n)) {
      for (const member of n.members) {
        elements.push(ts.createBindingElement(
          undefined,
          undefined,
          member.name,
        ));
      }
    } else if (ts.isTypeReferenceNode(n) || ts.isHeritageClause(n) || (ts.isIdentifier(n) && n !== messageDeclaration.node.name)) {
      const extendedType = printNode(n)
        .replace("Partial<", "")
        .replace(">", "")
        .replace(' extends ', '');
      let bindName;
      if (extendedType === "TilePoint") {
        bindName = "loc";
      } else if (extendedType === "Creature") {
        bindName = "creature";
      } else {
        throw new Error("unexpected type: " + extendedType);
      }
      restElements.push(
        ts.createBindingElement(
          ts.createToken(ts.SyntaxKind.DotDotDotToken),
          undefined,
          bindName,
        ),
      );
    } else if (ts.isIntersectionTypeNode(n)) {
      ts.forEachChild(n, visit);
    }
  }
  ts.forEachChild(messageDeclaration.node, visit);

  let type = ts.createQualifiedName(qualifier, messageDeclaration.name);
  if (commandOrEvent === 'command') {
    type = ts.createIndexedAccessTypeNode(type, ts.createLiteral('params'));
  }

  const name = ts.createObjectBindingPattern([...elements, ...restElements]);
  return ts.createParameter(
    undefined, /* decorators */
    undefined, /* modifiers */
    undefined, /* dotDotDotToken */
    name, /* name */
    undefined, /* questionToken */
    type /* type */
  );
}

/**
 * @param {{messageDeclaration: MessageDeclaration, typeName: ts.Node}}
 */
function createMessageBuilderFn({ messageDeclaration, typeName }) {
  /*
    export function adminSetItem({ item, ...loc }: Protocol.Commands.AdminSetItem): AdminSetFloorCommand {
      return { type: "adminSetItem", args: arguments[0] };
    }
  */

  const lowercasedType = lowercase(typeName);
  return ts.createFunctionDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    lowercasedType,
    undefined,
    [messageDeclaration.params],
    messageDeclaration.typeAlias.name,
    ts.createBlock([
      ts.createReturn(
        ts.createObjectLiteral([
          ts.createPropertyAssignment("type", ts.createLiteral(lowercasedType)),
          // Using arguments is probably faster than making an expression like "{item, ...loc}".
          ts.createPropertyAssignment("args", ts.createElementAccess(ts.createIdentifier("arguments"), 0)),
        ]),
      ),
    ], true),
  );
}

/**
 * @param {ts.Node} qualifier
 * @param {ts.Node} name
 * @param {string} firstParamTypeName
 * @param {MessageDeclaration[]} messageDeclarations
 */
function createProtocolInterface(qualifier, name, firstParamTypeName, messageDeclarations) {
  const members = messageDeclarations.map(messageDeclaration => {
    const firstParam = ts.createParameter(
      undefined,
      undefined,
      undefined,
      lowercase(firstParamTypeName),
      undefined,
      ts.createTypeReferenceNode(firstParamTypeName),
    );
    const messageParam = ts.createParameter(
      undefined,
      undefined,
      undefined,
      messageDeclaration.params,
    );

    let returnType = ts.createToken(ts.SyntaxKind.VoidKeyword);
    // TODO: could get rid of response/param lookups, since using Command<P, R> is so much better.
    // if (findNodeByName(messageDeclaration.node, 'response')) {
    //   returnType = ts.createIndexedAccessTypeNode(
    //     ts.createQualifiedName(qualifier, messageDeclaration.name),
    //     ts.createLiteral('response')
    //   );
    // }
    const commandNode = findNodeByTypeName(messageDeclaration.node, 'Command');
    if (commandNode) {
      returnType = ts.createIndexedAccessTypeNode(
        ts.createQualifiedName(qualifier, messageDeclaration.name),
        ts.createLiteral('response')
      );
      returnType = ts.createTypeReferenceNode('Promise', [returnType]);
    }

    return ts.createMethodSignature(
      undefined,
      [firstParam, messageParam],
      returnType,
      "on" + messageDeclaration.name.escapedText,
    );
  });
  return ts.createInterfaceDeclaration(
    undefined, /* decorators */
    [
      ts.createModifier(ts.SyntaxKind.ExportKeyword),
      ts.createModifier(ts.SyntaxKind.DefaultKeyword),
    ], /* modifiers */
    name, /* name */
    undefined, /* typeParameters */
    undefined, /* heritageClauses */
    members, /* members */
  );
}

function printNode(n) {
  const resultFile = ts.createSourceFile(
    "",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  return printer.printNode(
    ts.EmitHint.Unspecified,
    n,
    resultFile,
  );
}

function findNodeByName(node, name) {
  let result;
  function visit(n) {
    if (n.name && n.name.escapedText === name) {
      result = n;
      return;
    }
    ts.forEachChild(n, visit);
  }
  ts.forEachChild(node, visit);
  return result;
}

function findNodeByTypeName(node, typeName) {
  let result;
  function visit(n) {
    if (n.typeName && n.typeName.escapedText === typeName) {
      result = n;
      return;
    }
    ts.forEachChild(n, visit);
  }
  ts.forEachChild(node, visit);
  return result;
}

const program = ts.createProgram(["src/protocol/protocol.d.ts"], {
  noEmit: true,
});
const protocolDeclaration = program.getSourceFiles().find(f => f.path.includes("protocol.d.ts"));

if (process.env.DEBUG) {
  const debug = findNodeByName(protocolDeclaration, "debug");
  console.log(debug.members[0]);
  process.exit(0);
}

const commands = collect({ node: findNodeByName(protocolDeclaration, 'Commands'), commandOrEvent: 'command' });
const events = collect({ node: findNodeByName(protocolDeclaration, 'Events'), commandOrEvent: 'event' });

save(commands.builderCode, 'command-builder.ts');
save(commands.protocolInterfaceCode, 'server-interface.ts');
save(events.builderCode, 'event-builder.ts');
save(events.protocolInterfaceCode, 'client-interface.ts');
