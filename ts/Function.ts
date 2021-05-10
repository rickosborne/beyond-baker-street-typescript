export type MonoFunction<T, U> = (item: T) => U;
export type Callable = () => void;
export type BiFunction<T, U, V> = (t: T, u: U) => V;
export type TriFunction<T, U, V, W> = (t: T, u: U, v: V) => W;
