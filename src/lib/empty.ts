const createProxy = () => {
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (prop === 'toString' || prop === 'valueOf') {
        return () => '';
      }
      return new Proxy(() => {}, handler);
    },
    apply(target, thisArg, argumentsList) {
      return new Proxy(() => {}, handler);
    }
  };
  return new Proxy(() => {}, handler);
};

const mock = createProxy();

// Common drizzle-orm exports
export const sql = mock;
export const eq = mock;
export const and = mock;
export const inArray = mock;
export const desc = mock;
export const asc = mock;
export const like = mock;
export const relations = mock;
export const createClient = mock;
export const db = mock;
export const sqliteTable = mock;
export const text = mock;
export const integer = mock;
export const real = mock;
export const index = mock;
export const drizzle = mock;

export default mock;
