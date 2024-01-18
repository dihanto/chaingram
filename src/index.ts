import {
  Canister,
  Err,
  Ok,
  Principal,
  Record,
  Result,
  StableBTreeMap,
  Variant,
  Vec,
  query,
  text,
  update,
} from "azle";

const User = Record({
  id: Principal,
  name: text,
});

const Memo = Record({
  id: Principal,
  notes: text,
  userId: Principal,
  user: User, // Reference to the user
});

const Error = Variant({
  NotFound: text,
  InvalidPayload: text,
});

type Error = typeof Error.tsType;
type User = typeof User.tsType;
type Memo = typeof Memo.tsType;

let users = StableBTreeMap<Principal, User>(0);
let memos = StableBTreeMap<Principal, Memo>(1);

export default Canister({
  addUser: update([text], Result(User, Error), (name) => {
    const id = generateId();

    const user: User = {
      id,
      name,
    };

    users.insert(user.id, user);
    return Ok(user);
  }),

  findUserById: query([Principal], Result(User, Error), (id) => {
    const userResult = users.get(id);
    if ("None" in userResult) {
      return Err({
        NotFound: "Users not found",
      });
    }

    return Ok(userResult.Some);
  }),

  findUser: query([], Vec(User), () => {
    return users.values();
  }),

  findMemo: query([], Vec(Memo), () => {
    return memos.values();
  }),

  addMemo: update([text, Principal], Result(Memo, Error), (notes, userId) => {
    const id = generateId();
    const userResult = users.get(userId);
    if ("None" in userResult) {
      return Err({
        NotFound: `User with id ${userId.toString()} not found`,
      });
    }
    const memo: Memo = {
      id,
      notes,
      userId,
      user: userResult.Some,
    };

    memos.insert(memo.id, memo);
    return Ok(memo);
  }),

  editMemoById: update([Principal, text], Result(Memo, Error), (id, notes) => {
    const memoResult = memos.get(id);
    if ("None" in memoResult) {
      return Err({
        NotFound: `Memo with that id doesn't exist`,
      });
    }

    const memo = memoResult.Some;

    memo.notes = notes;

    return Ok(memo);
  }),

  deleteMemo: update([Principal], Result(Memo, Error), (id) => {
    const memoResult = memos.get(id);

    if ("None" in memoResult) {
      return Err({
        NotFound: `Photo with that id doesn't exist`,
      });
    }

    const memo = memoResult.Some;
    memos.remove(id);

    return Ok(memo);
  }),
});

function generateId(): Principal {
  const randoBytes = new Array(29)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 256));

  return Principal.fromUint8Array(Uint8Array.from(randoBytes));
}
