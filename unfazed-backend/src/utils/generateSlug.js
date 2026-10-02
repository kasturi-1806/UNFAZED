const Therapist = require("../models/Therapist");

const createBaseSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateUniqueSlug = async (name) => {
  const baseSlug = createBaseSlug(name);

  let slug = baseSlug;
  let counter = 1;

  while (await Therapist.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

module.exports = generateUniqueSlug;