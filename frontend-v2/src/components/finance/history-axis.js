// Select labels only. Every daily observation stays in the chart/tooltip data.
export function historyAxisTicks(days, width = 800) {
  if (!days.length) return [];
  const first = days[0].date;
  const last = days.at(-1).date;
  if (days.length <= 35) {
    const references = [first];
    let previousIndex = 0;
    days.forEach(({ date }, index) => {
      // Avoid adjacent labels around month boundaries and partial-period ends.
      if ([1, 5, 10, 15, 20, 25].includes(Number(date.slice(8)))
        && index - previousIndex >= 3 && days.length - 1 - index >= 3) {
        references.push(date);
        previousIndex = index;
      }
    });
    return [...new Set([...references, last])];
  }
  const capacity = Math.min(12, Math.max(2, Math.floor(Math.max(0, width - 116) / 80)));
  return [...new Set(Array.from({ length: capacity }, (_, index) => days[Math.round(index * (days.length - 1) / (capacity - 1))].date))];
}
