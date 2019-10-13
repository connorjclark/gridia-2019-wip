import { EventEmitter } from 'events';
import StrictEventEmitter from 'strict-event-emitter-types';

export interface GameActionEvent {
  action: GameAction;
  loc: TilePoint;
  creature: Creature;
}

interface Events {
  action: GameActionEvent;
  containerWindowSelectedIndexChanged: void;
  editingMode: {enabled: boolean};
  itemMoveBegin: ItemMoveBeginEvent;
  itemMoveEnd: ItemMoveEndEvent;
  message: import('../protocol/server-to-client-protocol-builder').Message;
  mouseMovedOverTile: TilePoint;
  panelFocusChanged: {panelName: string};
  playerMove: void;
  tileClicked: TilePoint;
}

const TypedEventEmitter: new() => StrictEventEmitter<EventEmitter, Events> = EventEmitter;

export default TypedEventEmitter;