import { Rep, TypeLevel, Utils } from "./src/generic-rep"

enum $A {}
enum $B {}

export namespace MapExamples {

    export type nullableInts = TypeLevel.map<Utils.nullable, [1, 2, 3, 4]>
    //-> [1 | null, 2 | null, 3 | null, 4 | null]

    type ParseBool = Rep.Lambda<$A, {
        if: {sub: {var: $A}, sup: {_: "yes"}},
        then : {_: true},
        else: {
            if: {sub: {var: $A}, sup: {_: "no"}},
            then: {_: false},
            else: {_: never},
        }
    }>;
    export type parsedBools = TypeLevel.map<ParseBool, ["yes", "no", "no", "yes", "yes", "yes", "not sure", "no"]>
    //-> [true, false, false, true, true, true, never, false]
}


export namespace FilterExamples {
    export namespace fromScratch {
        type NotFour = Rep.Lambda<$A, {
            if: {sub: {var: $A}, sup: {_: 4}},
            then: {_: false},
            else: {_: true}
        }>;

        export type exceptFours = TypeLevel.filter<NotFour, [1, 2, 4, 4, 3, 4, 0, "a"]>
        //-> [1, 2, 3, 0, "a"]
    }

    export namespace usingNot {
        type NotFour = Rep.Lambda<$A, {app: Utils.not, arg: {sub: {var: $A}, sup: {_: 4}}}>;

        export type exceptFours = TypeLevel.filter<NotFour, [1, 2, 4, 4, 3, 4, 0, "a"]>
        //-> [1, 2, 3, 0, "a"]
    }

    export namespace usingInvert {
        type NotFour = Utils.invert<Rep.Lambda<$A, {sub: {var: $A}, sup: {_: 4}}>>;

        export type exceptFours = TypeLevel.filter<NotFour, [1, 2, 4, 4, 3, 4, 0, "a"]>
        //-> [1, 2, 3, 0, "a"]
    }

    export namespace usingHelpers {
        type NotFour = Utils.invert<Utils.subtypeOf<4>>;

        export type exceptFours = TypeLevel.filter<NotFour, [1, 2, 4, 4, 3, 4, 0, "a"]>
        //-> [1, 2, 3, 0, "a"]
    }
}


export namespace ReduceExamples {
    type MakePair = Rep.Lambda<$A,
        Rep.Lambda<$B,
            {arr: [{var: $B}, {var: $A}]}
        >
    >;
    export type linkedList = TypeLevel.reduce<MakePair, null, [1, 2, 3, 4, 5]>;
    //-> [5, [4, [3, [2, [1, null]]]]]
}


export namespace EverythingCombined {
    type NotNullable = Utils.invert<Utils.supertypeOf<null>>;
    type WrapValue = Rep.Lambda<$A, {obj: {value: {var: $A}}}>;
    type MakePair = Rep.Lambda<$A, Rep.Lambda<$B, {arr: [{var: $B}, {var: $A}]}>>;

    type ValueLinkedListFromNullableArray<Arr extends unknown[]> =
        TypeLevel.reduce<MakePair, null,
            TypeLevel.map<WrapValue,
                TypeLevel.filter<NotNullable,
                    Arr>>>

    export type example = ValueLinkedListFromNullableArray<[1, 2 | null, 3, 4, 3 | null, 5]>;
    //-> [{value: 5}, [{value: 4}}, [{value: 3}, [{value: 1}, null]]]]
}