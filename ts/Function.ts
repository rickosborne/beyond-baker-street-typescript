export type MonoFunction<T, U> = (item: T) => U;
export type Callable = () => void;
export type Supplier<T> = () => T;
export type BiFunction<T, U, V> = (t: T, u: U) => V;
export type TriFunction<T, U, V, W> = (t: T, u: U, v: V) => W;
export type QuadFunction<T, U, V, W, X> = (t: T, u: U, v: V, w: W) => X;
