import { StatusCountPipe } from './status-count.pipe';

describe('StatusCountPipe', () => {
  it('create an instance', () => {
    const pipe = new StatusCountPipe();
    expect(pipe).toBeTruthy();
  });
});
