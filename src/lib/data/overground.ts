const lines = [
    {
        op: 'WEAVER',
        codes: ['G17', 'G16']
    },
    {
        op: 'SUFF',
        codes: ['G181', 'G182', 'G183', 'G185', 'G180', 'G192']
    },
    {
        op: 'MILDMAY',
        codes: ['G188', 'G189', 'G193', 'G184', 'G186']
    },
    {
        op: 'WINDRUSH',
        codes: ['G20', 'G194', 'G198', 'G196', 'G21']
    }
]

export function findOvergroundLine(uid: string) {
    let line = lines.find((l) => l.codes.some((c) => uid.includes(c)));
    return 'LO';
}