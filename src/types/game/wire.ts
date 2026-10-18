declare const wire: unique symbol;

export type JsonString<T> = string & { readonly [wire]: T };

export type Loose<T> = T | JsonString<T>;

export type Open<T extends string> = T | (string & Record<never, never>);

type Primitive = string | number | boolean | bigint | null | undefined;

export type Parsed<T> =
  T extends { readonly [wire]: infer U } ? Parsed<U> :
    T extends Primitive ? T :
      T extends ReadonlyArray<infer E> ? Array<Parsed<E>> :
        { -readonly [K in keyof T]: Parsed<T[K]> };
