it('sadf b', () => {
  const x = {ref: null};
  x.ref = x;
  expect(x.ref).toEqual({});
});
