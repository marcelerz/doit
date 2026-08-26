import { appendComment, amendComment, removeComment } from "../commentMutations";
import { Comment, getCommentId } from "@/types/types";
import { getTimestamp } from "@/types/time";

const existing = (id: string, content: string): Comment => ({
  commentId: getCommentId(id),
  history: [{ timestamp: getTimestamp(1000), content }],
});

describe("appendComment", () => {
  it("adds to the end without touching what is there", () => {
    const before = [existing("c1", "first")];
    const after = appendComment(before, "second", 2000);

    expect(after).toHaveLength(2);
    expect(after[0]).toBe(before[0]);
    expect(after[1].history[0].content).toBe("second");
  });

  it("does not mutate the input", () => {
    const before = [existing("c1", "first")];
    appendComment(before, "second", 2000);
    expect(before).toHaveLength(1);
  });

  it("gives each comment its own id", () => {
    const one = appendComment([], "a", 1)[0];
    const two = appendComment([], "b", 1)[0];
    expect(one.commentId).not.toBe(two.commentId);
  });
});

describe("amendComment", () => {
  it("appends to history rather than replacing it, so the original survives", () => {
    const before = [existing("c1", "original")];
    const after = amendComment(before, "c1", "edited", 2000);

    expect(after[0].history).toHaveLength(2);
    expect(after[0].history[0].content).toBe("original");
    expect(after[0].history[1].content).toBe("edited");
  });

  it("leaves other comments alone", () => {
    const before = [existing("c1", "one"), existing("c2", "two")];
    const after = amendComment(before, "c1", "edited", 2000);
    expect(after[1]).toBe(before[1]);
  });

  it("is a no-op for an unknown id", () => {
    const before = [existing("c1", "one")];
    expect(amendComment(before, "missing", "x", 2000)).toEqual(before);
  });
});

describe("removeComment", () => {
  it("drops only the named comment", () => {
    const before = [existing("c1", "one"), existing("c2", "two")];
    const after = removeComment(before, "c1");

    expect(after).toHaveLength(1);
    expect(after[0].commentId).toBe("c2");
  });

  it("is a no-op for an unknown id", () => {
    const before = [existing("c1", "one")];
    expect(removeComment(before, "missing")).toHaveLength(1);
  });

  it("does not mutate the input", () => {
    const before = [existing("c1", "one")];
    removeComment(before, "c1");
    expect(before).toHaveLength(1);
  });
});
