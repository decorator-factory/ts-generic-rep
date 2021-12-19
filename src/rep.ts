export declare class Fail<Message extends string, Detail> { #_: Fail<Message, Detail> };


export declare class Barrier<T, Tag> { #body: T; #tag: Tag }
export type Lambda<Var, Body> = { lambda: Var, do: Barrier<Body, Var> }


export type Rewrite<Fun extends AnyRep, ConstructedArg> = // Like `Apply`, but doesn't `Construct` the result
    Construct<Fun> extends infer ConstructedFun
    ? ConstructedFun extends Lambda<infer Var, infer Body>
        ? ReplaceVar<Body, Var, {_: ConstructedArg}>
        : Fail<"Expected a lambda, got:", ConstructedFun>
    : never


export type ApplyDyn<Fun, ConstructedArg> =
    Fun extends AnyRep
    ? Apply<Fun, ConstructedArg>
    : Fail<"Invalid rep:", Fun>


export type Apply<Fun extends AnyRep, ConstructedArg> = // Apply as lambda to a *constructed* argument
    Construct<Fun> extends infer ConstructedFun
        ? ConstructedFun extends Lambda<infer Var, infer Body>
            ? ReplaceVar<Body, Var, {_: ConstructedArg}> extends infer Result
                ? Result extends  AnyRep
                    ? Construct<Result>
                    : Fail<"Invalid rep after application:", Result>
                : never
            : Fail<"Expected a lambda, got:", ConstructedFun>
        : never


export type Apply2<Fun2 extends AnyRep, ConstructedArg1, ConstructedArg2> =
    Apply<Fun2, ConstructedArg1> extends infer PartiallyApplied
        ? PartiallyApplied extends AnyRep
            ? Apply<PartiallyApplied, ConstructedArg2>
            : PartiallyApplied
        : never;


export type ApplyC<ConstructedFun extends Lambda<unknown, unknown>, ConstructedArg> = // Apply a lambda to a *constructed* argument
    ConstructedFun extends Lambda<infer Var, infer Body>
        ? ReplaceVar<Body, Var, {_: ConstructedArg}> extends infer Result
            ? Result extends  AnyRep
                ? Construct<Result>
                : Fail<"Invalid rep after application:", Result>
            : never
        : never


export type AnyRep =
    | { _ : any }
    | { obj: Record<string, AnyRep> }
    | { and: [AnyRep, AnyRep] }
    | { union: AnyRep[] }
    | { arr: AnyRep[] }
    | { fun: AnyRep, returning: AnyRep }
    | { gen: AnyRep, returning: AnyRep }
    | { genMany: AnyRep, returning: AnyRep }
    | { var: unknown }
    | { app: AnyRep, arg: AnyRep }
    | { if: AnyRep, then: AnyRep, else: AnyRep }
    | { sub: AnyRep, sup: AnyRep }
    | { lambda: unknown, do: Barrier<AnyRep, unknown> };


export type Kind1 =  // We omit {_: object} because there's no easy way to specify "Not Lambda"
    | { _: number | string | unknown[] | ((...args: unknown[]) => unknown) | symbol | boolean | null | undefined | bigint }
    | { and: [Kind1, Kind1] }
    | { union: Kind1[] }
    | { arr: Kind1[] }
    | { obj: Record<string, Kind1> }
    | { fun: AnyRep, returning: AnyRep }
    | { gen: AnyRep, returning: AnyRep }
    | { genMany: AnyRep, returning: AnyRep }
    | { var: unknown }
    | { if: AnyRep, then: Kind1, else: Kind1 }
    | { sub: Kind1, sup: Kind1 }
    | { app: LambdaRep<Kind1>, arg: AnyRep };

export type Kind2 = LambdaRep<Kind1>;
export type Kind3 = LambdaRep<Kind2>;
export type Kind4 = LambdaRep<Kind3>;


export type IsKind1Rep<T> =
      T extends Kind1
    ? T

    : T extends { lambda: unknown, do: AnyRep }
    ? never

    : T;


export type FunRep =
    | { _: (...args: unknown[]) => unknown }
    | { and: [FunRep, AnyRep] }
    | { and: [AnyRep, FunRep] }
    | { fun: AnyRep, returning: AnyRep }
    | { gen: AnyRep, returning: AnyRep }
    | { genMany: AnyRep, returning: AnyRep }
    | { var: unknown }
    | { app: LambdaRep<FunRep>, arg: AnyRep }
    | { if: AnyRep, then: FunRep, else: FunRep }

export type LambdaRep<Ret extends AnyRep> =
    | { _: LambdaFor<Ret> }
    | LambdaFor<Ret>
    | { app: LambdaRep<LambdaRep<Ret>>, arg: AnyRep }
    | (Ret extends (...args: unknown[]) => unknown ? FunRep : never )
    | { if: AnyRep, then: LambdaRep<Ret>, else: LambdaRep<Ret> }

export type LambdaFor<Ret extends AnyRep> =
    { lambda: unknown, do: Barrier<Ret, unknown> }


export type Construct<Rep extends AnyRep> =
    // Constant type, like {_: number}
      Rep extends { _: infer T }
    ? T

    // Record type, like {obj: {x: {_: number}, y: {_: string}}}
    : Rep extends { obj: infer R }
    ? R extends Record<string, unknown>
        ? {[K in keyof R]:
            R[K] extends infer T
            ? T extends AnyRep
                ? Construct<T>
                : Fail<"Invalid rep:", T>
            : never}
        : Fail<"Expected a record with string keys, got:", R>

    // Intersection type
    : Rep extends { and: [infer A, infer B] }
        ? A extends AnyRep
            ? B extends AnyRep
                ? Construct<A> & Construct<B>
                : Fail<"Invalid rep:", B>
            : Fail<"Invalid rep:", A>

    // Array or tuple type
    : Rep extends { arr: infer A }
    ? A extends unknown[]
        ? {[K in keyof A]:
            A[K] extends infer T
            ? T extends AnyRep
                ? Construct<T>
                : Fail<"Invalid rep:", T>
            : never}
        : Fail<"Expected an array or tuple type, got:", A>

    // Union type, like {union: [{_: number}, {_: string}]}
    : Rep extends { union: infer U }
    ? U extends unknown[]
        ? {[K in keyof U]:
            U[K] extends infer T
            ? T extends AnyRep
                ? Construct<T>
                : Fail<"Invalid rep:", T>
            : never}[number]
        : Fail<"Expected a tuple type, got:", U>

    // Generic function (see examples later)
    : Rep extends { gen: infer Arg, returning: infer Ret }
        ? Arg extends AnyRep
            ? Ret extends AnyRep
                ? <A>(arg: Apply<Arg, A>) => Apply<Ret, A>
                : Fail<"Invalid rep:", Ret>
            : Fail<"Invalid rep:", Arg>

    // Generic function (see examples later)
    : Rep extends { genMany: infer Args, returning: infer Ret }
        ? Args extends AnyRep
            ? Ret extends AnyRep
                ? <A>(...args:
                        Apply<Args, A> extends infer Ts
                        ? Ts extends unknown[]
                            ? Ts
                            : [Fail<"Expected a tuple or array, got", Ts>]
                        : never) => Apply<Ret, A>
                : Fail<"Invalid rep:", Ret>
            : Fail<"Invalid rep:", Args>


    // Normal function, e.g. {fun: {arr: [{_: number}, {_: string}]}, returning: {_: string[]}}
    // means (number, string) -> string[]
    : Rep extends { fun: infer Args, returning: infer Ret }
        ? Args extends AnyRep
            ? Ret extends AnyRep
                ? Construct<Args> extends infer ConstructedArgs
                    ? ConstructedArgs extends unknown[]
                        ? (...args: ConstructedArgs) => Construct<Ret>
                        : Fail<"Expected an array or tuple type, got:",  ConstructedArgs>
                    : never
                : Fail<"Invalid rep:", Ret>
            : Fail<"Invalid rep:", Args>

    // Application of a lambda to an argument
    : Rep extends { app: infer App, arg: infer Arg }
        ? App extends AnyRep
            ? Arg extends AnyRep
                ? Apply<App, Construct<Arg>>
                : Fail<"Invalid rep:", Arg>
            : Fail<"Invalid rep:", App>

    : Rep extends { if: infer If, then: infer Then, else: infer Else }
        ? If extends AnyRep
            ? Then extends AnyRep
                ? Else extends AnyRep
                    ? Construct<If> extends infer Decision
                        ? Decision extends true
                            ? Construct<Then>
                            : Decision extends false
                                ? Construct<Else>
                                : Fail<"Expected `true` or `false`, got:", Decision>
                        : never
                    : Fail<"Invalid rep:", Else>
                : Fail<"Invalid rep:", Then>
            : Fail<"Invalid rep:", If>

    : Rep extends { sub: infer Sub, sup: infer Sup }
        ? Sub extends AnyRep
            ? Sup extends AnyRep
                ? Construct<Sub> extends infer ConstructedSub
                    ? Construct<Sup> extends infer ConstructedSup
                        ? ConstructedSub extends Fail<string, any>
                            ? ConstructedSub
                            : ConstructedSup extends Fail<string, any>
                                ? ConstructedSup
                                : ConstructedSub extends ConstructedSup
                                    ? true
                                    : false
                        : never
                    : never
                : Fail<"Invalid rep:", Sup>
            : Fail<"Invalid rep:", Sub>

    : Rep extends { var: infer Var }
    ? Fail<"Cannot construct a free variable:", Var>

    : Rep extends Lambda<infer Var, infer Body>
    ? Lambda<Var, Body>

    : Fail<"Cannot construct:", Rep>;



type ReplaceVar<T, Var, New> = (
    T extends {var: Var}
    ? New

    : T extends Function
    ? T

    : T extends Barrier<infer Inner, infer Tag>
        ? Var extends Tag
            ? T
            : Barrier<ReplaceVar<Inner, Var, New>, Tag>
    : T extends Record<any, any> | any[]
        ? {[K in keyof T]: ReplaceVar<T[K], Var, New>}

    : T);
