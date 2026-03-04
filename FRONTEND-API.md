# FRONTEND API TODO

The following is a list of functions that are defined and exported by [api.ts](/app/frontend/src/core/api.ts) that do not have proper implementations.

## me

Returns the current signed in `User` object.

Currently returns a predefined `TEST_USER`.
```ts
async function me(): User
```

## register

Takes an unimplemented `ApiEvent` type, and registers an account, returning the
corresponding `User` object.

Currently returns a predefined `TEST_USER`.
```ts
async function register(e: ApiEvent): User
```

## login

Takes an unimplemented `ApiEvent` type, and logs in an account, returning the
corresponding login token as a header.

Currently returns a predefined test token.
```ts
async function login(e: ApiEvent): { access_token: string }
```
## changePassword

Takes an unimplemented `ApiEvent` type, and changes an account's password, returning the
updated `User` object.

Currently returns a predefined `TEST_USER`.
```ts
async function changePassword(e: ApiEvent): User
```

## updateMe

Takes an unimplemented `ApiEvent` type, and returns an updated signed in `User` object.

Currently returns a predefined `TEST_USER`.
```ts
async function updateMe(e: ApiEvent): User
```

## completeOnboarding

Takes a `SubmitOnboardingEvent` type, and uploads the user's onboarding data in to the
databases. Returns a boolean indicating success.

```ts
async function completeOnboarding(e: SubmitOnboardingEvent): boolean
```

