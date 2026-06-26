import { AccountData, ContactType, GroupsType, SearchData } from './types'

type ContactLike =
  | Pick<ContactType, 'type' | 'source' | 'shared_groups'>
  | Pick<SearchData, 'type' | 'source'>

const GROUP_PREFIX = 'group:'

function getPhonebookPermissions(profile?: AccountData['profile']) {
  return profile?.macro_permissions?.phonebook?.permissions || {}
}

function getPermissionValue(
  profile: AccountData['profile'] | undefined,
  permissionName: string,
) {
  const permissions = getPhonebookPermissions(profile)
  const permission = permissions?.[permissionName]
  return permission?.value === true
}

export function getPresencePanelPermissions(profile?: AccountData['profile']) {
  return profile?.macro_permissions?.presence_panel?.permissions || {}
}

export function getAllowedOperatorGroupsIds(profile?: AccountData['profile']) {
  const permissions = getPresencePanelPermissions(profile)

  return Object.keys(permissions).filter((permissionName) => {
    return permissionName.startsWith('grp_') && permissions[permissionName]?.value === true
  })
}

/**
 * Operator groups a user may share a phonebook contact with: the groups the
 * user is directly a member of, plus every group when they hold full phonebook
 * management permission (level 2 / ad_phonebook).
 *
 * Sharing must depend only on the groups assigned to the user, NOT on
 * presence-panel permissions (all_groups / grp_*), mirroring the
 * nethcti-middleware write validation.
 */
export function getVisiblePhonebookGroups(
  allGroups: GroupsType | undefined,
  canShareAllGroups: boolean | undefined,
  username: string | undefined,
) {
  const groups = allGroups || {}

  if (canShareAllGroups) {
    return Object.keys(groups).sort((left, right) => left.localeCompare(right))
  }

  return Object.keys(groups)
    .filter((groupName) => !!username && groups[groupName]?.users.includes(username))
    .sort((left, right) => left.localeCompare(right))
}

export function getPhonebookPermissionLevel(profile?: AccountData['profile']) {
  if (!profile?.macro_permissions?.phonebook?.value) {
    return -1
  }

  if (
    getPermissionValue(profile, 'phonebook_level_2') ||
    getPermissionValue(profile, 'ad_phonebook')
  ) {
    return 2
  }

  if (getPermissionValue(profile, 'phonebook_level_1')) {
    return 1
  }

  if (getPermissionValue(profile, 'phonebook_level_0')) {
    return 0
  }

  return 0
}

export function canWritePhonebookVisibility(
  profile: AccountData['profile'] | undefined,
  visibility: 'public' | 'private' | 'group',
) {
  const permissionLevel = getPhonebookPermissionLevel(profile)

  if (permissionLevel < 1) {
    return false
  }

  if (permissionLevel === 1) {
    return visibility === 'private'
  }

  return true
}

export function normalizeSharedGroups(sharedGroups?: string[] | null) {
  if (!Array.isArray(sharedGroups)) {
    return []
  }

  return [
    ...new Set(
      sharedGroups
        .map((groupName) => `${groupName || ''}`.trim())
        .filter(Boolean),
    ),
  ]
}

export function serializeSharedGroups(sharedGroups?: string[] | null) {
  const normalizedGroups = normalizeSharedGroups(sharedGroups)

  if (normalizedGroups.length === 0) {
    throw new Error('Cannot serialize group visibility without shared groups')
  }

  return `${GROUP_PREFIX}${normalizedGroups.join(',')}`
}

export function getContactSharedGroups(contact?: ContactLike | null) {
  if (!contact) {
    return []
  }

  if ('shared_groups' in contact) {
    const normalizedGroups = normalizeSharedGroups(contact.shared_groups)
    if (normalizedGroups.length > 0) {
      return normalizedGroups
    }
  }

  const type = `${contact.type || ''}`.trim()
  if (!type.startsWith(GROUP_PREFIX)) {
    return []
  }

  return normalizeSharedGroups(type.slice(GROUP_PREFIX.length).split(','))
}

export function getContactVisibility(contact?: ContactLike | null) {
  if (!contact) {
    return 'public'
  }

  const sharedGroups = getContactSharedGroups(contact)
  if (sharedGroups.length > 0) {
    return 'group'
  }

  return contact.type === 'private' && contact.source === 'cti' ? 'private' : 'public'
}
