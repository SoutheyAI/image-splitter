console.log('Current date:', new Date());
console.log('Current timestamp:', new Date().valueOf());
console.log('Current ISO string:', new Date().toISOString());

// 测试特定日期
const testDate = new Date('2024-01-25 19:00');
console.log('\nTest date:', testDate);
console.log('Test timestamp:', testDate.valueOf());
console.log('Test ISO string:', testDate.toISOString());
