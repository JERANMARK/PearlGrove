const MIN_JWT_SECRET_LENGTH = 32;

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  const distinctCharacters = typeof secret === 'string' ? new Set(secret).size : 0;
  if (typeof secret !== 'string' || secret !== secret.trim() || /replace|change_this|example|password|secret/i.test(secret) || Buffer.byteLength(secret, 'utf8') < MIN_JWT_SECRET_LENGTH || distinctCharacters < 16) {
    throw new Error(`JWT_SECRET must be a non-placeholder secret of at least ${MIN_JWT_SECRET_LENGTH} bytes with sufficient character diversity.`);
  }
  return secret;
};

