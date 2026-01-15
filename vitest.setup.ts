/**
 * Vitest 设置文件
 * 配置 fast-check 属性测试支持
 */

import { it, test } from 'vitest';
import * as fc from 'fast-check';

// 为 vitest 添加 .prop 方法支持
// @ts-ignore - 动态添加方法，类型检查会报错但运行时正常
it.prop = (arbitraries: any[], options?: any) => {
  return (name: string, fn: (...args: any[]) => void | Promise<void>) => {
    return it(name, () => {
      return fc.assert(
        // @ts-ignore - spread 操作符类型推断问题
        fc.property(...arbitraries, fn),
        options
      );
    });
  };
};

// @ts-ignore - 动态添加方法，类型检查会报错但运行时正常
test.prop = (arbitraries: any[], options?: any) => {
  return (name: string, fn: (...args: any[]) => void | Promise<void>) => {
    return test(name, () => {
      return fc.assert(
        // @ts-ignore - spread 操作符类型推断问题
        fc.property(...arbitraries, fn),
        options
      );
    });
  };
};
