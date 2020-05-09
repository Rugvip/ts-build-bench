export const export8num = 1;
export const export8string = '';
export const export8func = () => {
  return '';
};
export const export8class = class SomeClass {
  private readonly member1 = '1';
  private readonly member2 = '2';
  private readonly member3 = '3';
  private readonly member4 = '4';
  private readonly member5 = '5';
  private readonly member6 = '6';
  private readonly member7 = '7';
  private readonly member8 = '8';

  method1() {
    return '1';
  }
  method2() {
    return '2';
  }
  method3() {
    return '3';
  }
  method4() {
    return '4';
  }
  method5() {
    return '5';
  }
  method6() {
    return '6';
  }
  method7() {
    return '7';
  }
  method8() {
    return '8';
  }
};

type BucketData = { [key in string]: string };

class StorageBucket implements Storage {
  private static noPropAccessProxyHandler: ProxyHandler<StorageBucket> = {
    get(target, prop) {
      if (prop in target) {
        return target[prop as any];
      }
      throw new Error(
        'Direct property access is not allowed for StorageBuckets'
      );
    },
    set() {
      throw new Error(
        'Direct property access is not allowed for StorageBuckets'
      );
    },
  };

  static forStorage(storage: Storage, bucket: string) {
    const storageBucket = new StorageBucket(storage, bucket);
    return new Proxy(storageBucket, StorageBucket.noPropAccessProxyHandler);
  }

  static forLocalStorage(bucket: string): StorageBucket {
    return StorageBucket.forStorage(localStorage, bucket);
  }

  private constructor(
    private readonly storage: Storage,
    private readonly bucket: string
  ) {}

  [name: string]: any;

  get length(): number {
    throw new Error('Method not implemented.');
  }

  clear(): void {
    this.storage.removeItem(this.bucket);
  }

  getItem(key: string): string | null {
    return this.read()?.[key] ?? null;
  }

  key(): never {
    throw new Error('Method not implemented.');
  }

  removeItem(key: string): void {
    const data = this.read();
    if (!data) {
      return;
    }

    if (key in data) {
      delete data[key];
      this.write(data);
    }
  }

  setItem(key: string, value: string): void {
    const data = this.read() ?? {};
    data[key] = value;
    this.write(data);
  }

  private read(): BucketData | undefined {
    const bucketValue = this.storage.getItem(this.bucket);
    if (!bucketValue) {
      return undefined;
    }

    try {
      return JSON.parse(bucketValue);
    } catch {
      return undefined;
    }
  }

  private write(data: BucketData) {
    this.storage.setItem(this.bucket, JSON.stringify(data));
  }
}

export const export8bigClass = StorageBucket;
