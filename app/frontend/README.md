# READ THIS BEFORE EDITING THE FRONTEND

## Installing Packages

ANY TIME you install a package, be certain that your CLI is in the `frontend` directory, or the `package.json` will not be updated.

## Running Expo

Run `npm install`.
Run `npm start`.
Done.

Use Node version 20.

## Adding Tabs to the Navbar

Go to [frontend/src/app/(tabs)/_layout.tsx](./src/app/(tabs)/_layout.tsx), and where you see all the
`Tabs.Screen` components, add a new component like this:
```js
<Tabs.Screen
   name="mytab"
   options={{
      title: 'Tab Display Text',
      tabBarIcon: ({ color }) => <TabBarIcon name="assetname" color={color} />,
   }}
/>
```
This will link to a `mytab.tsx` file, under the `(tabs)` folder.
