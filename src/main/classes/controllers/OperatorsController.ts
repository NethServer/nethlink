export const buildOperators = (operatorsStore: any) => {
  const operators = [...operatorsStore.userEndpoints]

  // groups

  for (const [groupName, groupData] of Object.entries(operatorsStore.groups)) {
    // @ts-ignore
    for (const username of groupData.users) {
      if (operators[username]) {
        const groups = operators[username].groups || []
        groups.push(groupName)
        operators[username].groups = groups
      }
    }
  }

  // conversations

  for (const [extNum, extData] of Object.entries(operatorsStore.extensions)) {
    // @ts-ignore
    if (!isEmpty(extData.conversations)) {
      const opFound: any = Object.values(operators).find((op: any) => {
        return op.endpoints.extension.some((ext: any) => ext.id === extNum)
      })

      if (opFound) {
        const conversations = opFound.conversations || []

        // @ts-ignore
        Object.values(extData.conversations).forEach((conv) => {
          conversations.push(conv)
        })
        opFound.conversations = conversations
      }
    }
  }

  // favorites

  // eslint-disable-next-line no-unsafe-optional-chaining
  for (const username of operatorsStore?.favorites) {
    if (operators[username]) {
      operators[username].favorite = true
    }
  }
  // avatars

  for (const [username, avatarBase64] of Object.entries(operatorsStore.avatars)) {
    if (operators[username]) {
      operators[username].avatarBase64 = avatarBase64
    }
  }
}
