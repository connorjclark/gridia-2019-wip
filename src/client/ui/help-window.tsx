/* eslint-disable max-len */

import { render, h, Component } from 'preact';
import { useState } from 'preact/hooks';
import Game from '../game';
import { makeUIWindow } from './ui-common';

const sections: Record<string, string> = {
  'General': `
    <a href="https://github.com/connorjclark/gridia-2019-wip" target="_blank">GitHub</a>

    WASD: movement

    Number keys / Click: Equip tool in inventory

    Arrow keys / Click: select item in the world

    Space: use tool on selected item in the world

    Alt: use hand on selected item in the world

    Shift: Pick up selected item (or drag/drop to slot or character)
  `,
  'Attributes, Skills and Leveling Up': `
    Attribute levels consist of base points (selected when you create a character), and earned points (purchased with combat XP)
    
    Skill levels consist of base points (derived from attribute levels), and earned points (increase as you perform the skill)

    Only XP from combat skills contribute to your Combat Level

    With every Combat Level you gain a skill point, which can be used to learn new skills
  `,
  'Crafting': `
    Lorem Ipsum ...
  `,
  'Combat': `
    Q/E to cycle nearby targets

    R to attack currently selected target
  `,
  'Spells': `
    Lorem Ipsum ...
  `,
  'Chat': `
    Type /help to list all chat commands
  `,
  'Land Ownership': `
    Land is broken up into 20x20 groups called sectors

    Check "Show Grid" in Settings to visualize sectors

    /landClaim to claim a sector
    /landUnclaim to unclaim a sector
    /landOwner to view who owns a sector
  `,
};

export function makeHelpWindow(game: Game) {
  class HelpWindow extends Component {
    render() {
      const [currentSection, setCurrentSection] = useState('General');

      return <div class="help flex">
        <div class="sections">
          {Object.keys(sections).map((name) => {
            const classes = ['section'];
            if (name === currentSection) classes.push('selected');
            return <div class={classes.join(' ')} onClick={() => setCurrentSection(name)}>{name}</div>;
          })}
        </div>

        <div class="current-section">
          <div dangerouslySetInnerHTML={{ __html: sections[currentSection].replace(/\n/g, '<br>') }}></div>
        </div>
      </div>;
    }
  }

  const el = makeUIWindow({ name: 'help', cell: 'center' });
  render(<HelpWindow />, el);
  return { el };
}
