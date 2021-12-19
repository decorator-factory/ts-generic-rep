import * as Rep from "./rep";
export { Rep };

export namespace Utils {
    enum $A {}
    export type not = Rep.Lambda<$A, {if: {var: $A}, then: {_: false}, else: {_: true}}>;
    export type invert<Predicate extends Rep.Kind2> = Rep.Lambda<$A, {app: not, arg: {app: Predicate, arg: {var: $A}}}>;
    export type nullable = Rep.Lambda<$A, {union: [{var: $A}, {_: null}]}>;
    export type subtypeOf<T> = Rep.Lambda<$A, {sub: {var: $A}, sup: {_: T}}>;
    export type supertypeOf<T> = Rep.Lambda<$A, {sub: {_: T}, sup: {var: $A}}>;
}


export namespace TypeLevel {
    type _map<
        Fn extends Rep.Kind2,
        Arr extends unknown[],
        Acc extends unknown[],
    > = Arr extends [infer First, ...infer Rest]
        ? _map<Fn, Rest, [...Acc, Rep.Apply<Fn, First>]>
        : Acc

    export type map<
        Fn extends Rep.Kind2,
        Arr extends unknown[],
    > = _map<Fn, Arr, []>


    type _filter<
        Predicate extends Rep.Kind2,
        Arr extends unknown[],
        Acc extends unknown[],
    > = Arr extends [infer First, ...infer Rest]
        ? Rep.Apply<Predicate, First> extends true
            ? _filter<Predicate, Rest, [...Acc, First]>
            : _filter<Predicate, Rest, Acc>
        : Acc

    export type filter<
        Predicate extends Rep.Kind2,
        Arr extends unknown[],
    > = _filter<Predicate, Arr, []>;

    export type reduce<
        Reducer extends Rep.Kind3,  // Acc -> (Element -> Acc)
        Initial,
        Arr extends unknown[],
    > = Arr extends [infer First, ...infer Rest]
        ? reduce<Reducer, Rep.Apply2<Reducer, Initial, First>, Rest>
        : Initial;
}
