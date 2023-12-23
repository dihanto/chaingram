import {
  Canister,
  Principal,
  Record,
  Result,
  StableBTreeMap,
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

type UserResult = Result<User, text>;
type MemoResult = Result<Memo, text>;

let users = StableBTreeMap<Principal, User>(0);
let memos = StableBTreeMap<Principal, Memo>(1);

export default Canister({
  addUser: update([text], UserResult, (name) => {
    const id = Principal.fromRandom();

    const user: User = {
      id,
      name,
    };

    users.insert(user.id, user);
    return Result.Ok(user);
  }),

  getUserById: query([Principal], UserResult, (id) => {
    const userResult = users.get(id);
    return userResult.map_err(() => "User not found");
  }),

  getUsers: query([], Vec(User), () => users.values()),

  getMemos: query([], Vec(Memo), () => memos.values()),

  addMemo: update([text, Principal], MemoResult, (notes, userId) => {
    const id = Principal.fromRandom();
    const userResult = users.get(userId);

    return userResult.match(
      () => Result.Err("User not found"),
      (user) => {
        const memo: Memo = {
          id,
          notes,
          userId,
          user,
        };

        memos.insert(memo.id, memo);
        return Result.Ok(memo);
      }
    );
  }),

  editMemoById: update([Principal, text], MemoResult, (id, notes) => {
    const memoResult = memos.get(id);
    return memoResult.match(
      () => Result.Err("Memo not found"),
      (memo) => {
        memo.notes = notes;
        return Result.Ok(memo);
      }
    );
  }),

  deleteMemo: update([Principal], MemoResult, (id) => {
    const memoResult = memos.remove(id);
    return memoResult.match(
      () => Result.Err("Memo not found"),
      (memo) => Result.Ok(memo)
    );
  }),
});
