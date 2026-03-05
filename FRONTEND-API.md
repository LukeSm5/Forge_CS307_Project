# FRONTEND API TODO

The following is a list of functions that are defined and exported by [api.ts](/app/frontend/src/core/api.ts) that do not have proper implementations.

## me

Returns the current signed in `User` object, or `undefined` if not logged in.

Currently returns a predefined `TEST_USER`.
```ts
async function me(): Promise<User | undefined>
```

## register

Takes an unimplemented `ApiEvent` type, and registers an account, returning the
corresponding `User` object, or `undefined` on failure.

Currently returns a predefined `TEST_USER`.
```ts
async function register(e: ApiEvent): Promise<User | undefined>
```

## login

Takes an unimplemented `ApiEvent` type, and logs in an account, returning the
corresponding login token as a header, or `undefined` if login fails.

Currently returns a predefined test token.
```ts
async function login(e: ApiEvent): Promise<{ access_token: string | undefined }>
```
## changePassword

Takes an unimplemented `ApiEvent` type, and changes an account's password, returning the
updated `User` object, or `undefined` on failure.

Currently returns a predefined `TEST_USER`.
```ts
async function changePassword(e: ApiEvent): Promise<User | undefined>
```

## updateMe

Takes an unimplemented `ApiEvent` type, and returns an updated signed in `User` object, or `undefined` if not signed in.

Currently returns a predefined `TEST_USER`.
```ts
async function updateMe(e: ApiEvent): Promise<User | undefined>
```

## completeOnboarding

Takes a `SubmitOnboardingEvent` type, and uploads the user's onboarding data in to the
databases. Returns a boolean indicating success.

```ts
type SubmitOnboardingEvent = {
  /** The user's health score on a scale of [0, 100] */
  healthScore: number,

  /** The user's response to what their fitness goals are, used for prompting. */
  goals: string,
  
  /** The user's response about their previous lifting experience, used for prompting. */
  previousExperience: string,

  /** The user's preferred bio for their profile. */
  bio: string
};

async function completeOnboarding(e: SubmitOnboardingEvent): Promise<boolean>
```

## searchCardioMachine

Takes a `SearchCardioMachineEvent` type, and prompts the LLM to search for cardio machines based on the user's profile and request in the search event. Returns an array of `SearchCardioMachineResponse`, which include data for each cardio machine the LLM returns to display.

```ts
type SearchCardioMachineResponse = {
  name: string,
  desc: string,
};

type SearchCardioMachineEvent = {
  desc: string
};

async function searchCardioMachine(e: SearchCardioMachineEvent): Promise<SearchCardioMachineResponse[]>
```

