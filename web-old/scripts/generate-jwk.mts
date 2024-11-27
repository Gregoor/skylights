// Taken from https://github.com/likeandscribe/frontpage/blob/08923911e18f423f758e724bf3a78c7cb7816edb/packages/frontpage/scripts/generate-jwk.mts
const keyPair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" },
  true,
  ["sign", "verify"],
);

const [privateKey, publicKey] = await Promise.all(
  [keyPair.privateKey, keyPair.publicKey].map((key) =>
    crypto.subtle.exportKey("jwk", key),
  ),
);

console.log(
  `PRIVATE_JWK='${JSON.stringify(privateKey)}'\nPUBLIC_JWK='${JSON.stringify(publicKey)}'`,
);
