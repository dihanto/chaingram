import {
  $update,
  $query,
  Result,
  StableBTreeMap,
  Vec,
  Record,
  match,
  Opt,
  nat64,
  ic,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the User type for storing user information
type User = Record<{
  id: string;
  name: string;
  createAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Define the Memo type for storing memo information
type Memo = Record<{
  id: string;
  notes: string;
  userId: string;
  user: User; // Reference to the user
  createAt: nat64;
  updatedAt: Opt<nat64>;
}>;

// Create StableBTreeMap to store users and memos
const users = new StableBTreeMap<string, User>(0, 44, 1024);
const memos = new StableBTreeMap<string, Memo>(1, 44, 1024);

$update;
// Function to add a new user
export function addUser(name: string): Result<User, string> {
  try {
    if (typeof name !== 'string' || name.trim() === '') {
      return Result.Err<User, string>('Invalid ID parameter.');
    }
  
    const id = uuidv4();
    const user: User = {
      id,
      name,
      createAt: ic.time(),
      updatedAt: Opt.None,
    };

    // Insert the new user into the user list
    users.insert(user.id, user);
    return Result.Ok<User, string>(user);
  } catch (error) {
    return Result.Err<User, string>(`Failed to add user: ${error}`);
  }
}

$query;
// Function to get a user by ID
export function getUserById(id: string): Result<User, string> {
  // Validate the id parameter to ensure it's a valid string
  if (typeof id !== 'string' || id.trim() === '') {
    return Result.Err<User, string>('Invalid ID parameter.');
  }

  return match(users.get(id), {
    Some: (user) => Result.Ok<User, string>(user),
    None: () => Result.Err<User, string>("User not found"),
  });
}

$query;
// Function to get all users
export function getUsers(): Result<Vec<User>, string> {
  try {
    // Return all users
    return Result.Ok(users.values());
  } catch (error) {
    return Result.Err<Vec<User>, string>(`Error retrieving users: ${error}`);
  }
}

$query;
// Function to get all memos
export function getMemos(): Result<Vec<Memo>, string> {
  try {
    // Return all memos
    return Result.Ok(memos.values());
  } catch (error) {
    return Result.Err<Vec<Memo>, string>(`Error retrieving memos: ${error}`);
  }
}

$update;
// Function to add a new memo
export function addMemo(notes: string, userId: string): Result<Memo, string> {
  try {
    // Validate the userId parameter to ensure it's a valid string
    if (typeof userId !== 'string' || userId.trim() === '') {
      return Result.Err<Memo, string>('Invalid userId parameter.');
    }

    if (typeof notes !== 'string' || notes.trim() === '') {
      return Result.Err<Memo, string>('Invalid ID parameter.');
    }
  

    const id = uuidv4();
    return match(users.get(userId), {
      Some: (user) => {
        const memo: Memo = {
          id,
          notes,
          userId,
          user,
          createAt: ic.time(),
          updatedAt: Opt.None,
        };

        // Insert the new memo into the memo list
        memos.insert(memo.id, memo);
        return Result.Ok<Memo, string>(memo);
      },
      None: () => Result.Err<Memo, string>("User not found"),
    });
  } catch (error) {
    return Result.Err<Memo, string>(`Failed to add memo: ${error}`);
  }
}

$update;
// Function to edit a memo by ID
export function editMemoById(id: string, notes: string): Result<Memo, string> {
  // Validate the id parameter to ensure it's a valid string
  if (typeof id !== 'string' || id.trim() === '') {
    return Result.Err<Memo, string>('Invalid ID parameter.');
  }

  return match(memos.get(id), {
    Some: (memo) => {
      try {
        // Update the notes property of the memo
        memo.notes = notes;
        return Result.Ok<Memo, string>(memo);
      } catch (error) {
        return Result.Err<Memo, string>(`Failed to edit memo with ID=${id}: ${error}`);
      }
    },
    None: () => Result.Err<Memo, string>("Memo not found"),
  });
}

$update;
// Function to delete a memo by ID
export function deleteMemo(id: string): Result<Memo, string> {
  // Validate the id parameter to ensure it's a valid string
  if (typeof id !== 'string' || id.trim() === '') {
    return Result.Err<Memo, string>('Invalid ID parameter.');
  }

  return match(memos.remove(id), {
    Some: (memo) => Result.Ok<Memo, string>(memo),
    None: () => Result.Err<Memo, string>("Memo not found"),
  });
}

// Cryptographic utility for generating random values
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
