import { getLibs } from '../../scripts/utils.js';
const { getConfig } = await import(`${getLibs()}/utils/utils.js`);

export const origin = getConfig().env.name === 'local' ? 'http://localhost:8787' : 'https://admin.da.live';
export const conOrigin = 'https://content.da.live';
export const hlxOrigin = 'https://admin.hlx.page';
