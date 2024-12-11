# neth-connector-electron

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

### Release

```bash
# For major
$ npm run publish:major

# For minor
$ npm run publish:minor

# For patch
$ npm run publish:patch
```

### Env variables ONLY FOR TEST PURPOSE

> `DEV=true`\
> run app in DEV mode

> `INSTANCE=<numer_of_the_instance>`\
> enables multiple instances of the process. Use this function with extreme caution, it can cause many problems - for testing purposes only. When this variable is set, a new `user_data_<instance_number>.json` is created and the instance only changes its related file.
