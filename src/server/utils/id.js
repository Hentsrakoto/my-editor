// petit utilitaire pour id (remplacable par uuid)
function makeId(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
module.exports = { makeId };
