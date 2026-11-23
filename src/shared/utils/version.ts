// Versions are vX.Y.Z for a stable release and vX.Y.Z-testing.N for a testing
// pre-release, published on every push to main.

type ParsedVersion = {
  major: number
  minor: number
  patch: number
  // the testing number, undefined for a stable release
  testing?: number
}

export const parseVersion = (version: string): ParsedVersion | undefined => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-testing\.(\d+))?$/.exec(
    version.trim(),
  )
  if (!match) return undefined
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    testing: match[4] === undefined ? undefined : Number(match[4]),
  }
}

export const isTestingVersion = (version: string) =>
  parseVersion(version)?.testing !== undefined

// > 0 when a is newer than b; the testing releases of X.Y.Z come before X.Y.Z
export const compareVersions = (a: string, b: string): number => {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  if (!va || !vb) return 0
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (va[key] !== vb[key]) return va[key] - vb[key]
  }
  if (va.testing === vb.testing) return 0
  if (va.testing === undefined) return 1
  if (vb.testing === undefined) return -1
  return va.testing - vb.testing
}

export type ReleaseInfo = {
  tag_name: string
  html_url: string
  draft?: boolean
  prerelease?: boolean
}

// The newest release the user should update to: a stable installation only
// looks at the stable releases already promoted (an official release is
// published as a pre-release and promoted by hand), a testing one at every
// testing and stable release.
export const findUpdate = (
  currentVersion: string,
  releases: ReleaseInfo[],
): ReleaseInfo | undefined => {
  const onTesting = isTestingVersion(currentVersion)
  return releases
    .filter((r) => !r.draft && parseVersion(r.tag_name))
    .filter(
      (r) => onTesting || (!isTestingVersion(r.tag_name) && !r.prerelease),
    )
    .filter((r) => compareVersions(r.tag_name, currentVersion) > 0)
    .sort((a, b) => compareVersions(b.tag_name, a.tag_name))[0]
}
