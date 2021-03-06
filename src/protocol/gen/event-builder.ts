/* Auto generated by build/build-protocol.js */

type AnimationEvent = {
    type: "animation";
    args: Protocol.Events.Animation;
};
type ContainerEvent = {
    type: "container";
    args: Protocol.Events.Container;
};
type InitializeEvent = {
    type: "initialize";
    args: Protocol.Events.Initialize;
};
type InitializePartitionEvent = {
    type: "initializePartition";
    args: Protocol.Events.InitializePartition;
};
type LogEvent = {
    type: "log";
    args: Protocol.Events.Log;
};
type RemoveCreatureEvent = {
    type: "removeCreature";
    args: Protocol.Events.RemoveCreature;
};
type SectorEvent = {
    type: "sector";
    args: Protocol.Events.Sector;
};
type SetCreatureEvent = {
    type: "setCreature";
    args: Protocol.Events.SetCreature;
};
type SetFloorEvent = {
    type: "setFloor";
    args: Protocol.Events.SetFloor;
};
type SetItemEvent = {
    type: "setItem";
    args: Protocol.Events.SetItem;
};
type XpEvent = {
    type: "xp";
    args: Protocol.Events.Xp;
};
type ChatEvent = {
    type: "chat";
    args: Protocol.Events.Chat;
};
type TimeEvent = {
    type: "time";
    args: Protocol.Events.Time;
};
type DialogueEvent = {
    type: "dialogue";
    args: Protocol.Events.Dialogue;
};
type SetAttackTargetEvent = {
    type: "setAttackTarget";
    args: Protocol.Events.SetAttackTarget;
};

export type ProtocolEvent = AnimationEvent | ContainerEvent | InitializeEvent | InitializePartitionEvent | LogEvent | RemoveCreatureEvent | SectorEvent | SetCreatureEvent | SetFloorEvent | SetItemEvent | XpEvent | ChatEvent | TimeEvent | DialogueEvent | SetAttackTargetEvent;

export function animation({ name, path }: Protocol.Events.Animation): AnimationEvent {
    return { type: "animation", args: arguments[0] };
}
export function container({ container }: Protocol.Events.Container): ContainerEvent {
    return { type: "container", args: arguments[0] };
}
export function initialize({ player, creatureId, secondsPerWorldTick, ticksPerWorldDay }: Protocol.Events.Initialize): InitializeEvent {
    return { type: "initialize", args: arguments[0] };
}
export function initializePartition({ ...loc }: Protocol.Events.InitializePartition): InitializePartitionEvent {
    return { type: "initializePartition", args: arguments[0] };
}
export function log({ msg }: Protocol.Events.Log): LogEvent {
    return { type: "log", args: arguments[0] };
}
export function removeCreature({ id }: Protocol.Events.RemoveCreature): RemoveCreatureEvent {
    return { type: "removeCreature", args: arguments[0] };
}
export function sector({ tiles, ...loc }: Protocol.Events.Sector): SectorEvent {
    return { type: "sector", args: arguments[0] };
}
export function setCreature({ partial, ...creature }: Protocol.Events.SetCreature): SetCreatureEvent {
    return { type: "setCreature", args: arguments[0] };
}
export function setFloor({ floor, ...loc }: Protocol.Events.SetFloor): SetFloorEvent {
    return { type: "setFloor", args: arguments[0] };
}
export function setItem({ location, item }: Protocol.Events.SetItem): SetItemEvent {
    return { type: "setItem", args: arguments[0] };
}
export function xp({ skill, xp }: Protocol.Events.Xp): XpEvent {
    return { type: "xp", args: arguments[0] };
}
export function chat({ section, from, text }: Protocol.Events.Chat): ChatEvent {
    return { type: "chat", args: arguments[0] };
}
export function time({ epoch }: Protocol.Events.Time): TimeEvent {
    return { type: "time", args: arguments[0] };
}
export function dialogue({ dialogue, index }: Protocol.Events.Dialogue): DialogueEvent {
    return { type: "dialogue", args: arguments[0] };
}
export function setAttackTarget({ creatureId }: Protocol.Events.SetAttackTarget): SetAttackTargetEvent {
    return { type: "setAttackTarget", args: arguments[0] };
}