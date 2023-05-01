const resourceMetadata = {
  stone: { category: "1Raw", order: 1, icon48: "./assets/stone-48.png", name: "Stone" },
  coal: { category: "1Raw", order: 2, icon48: "./assets/coal-48.png", name: "Coal" },
  ironOre: { category: "1Raw", order: 3, icon48: "./assets/ironOre-48.png", name: "Iron Ore" },
  copperOre: { category: "1Raw", order: 4, icon48: "./assets/copperOre-48.png", name: "Copper Ore" },
  oilBarrel: { category: "1Raw", order: 5, icon48: "./assets/oilBarrel-48.png", name: "Oil Barrel" },
  bricks: { category: "2Basic", order: 1, icon48: "./assets/bricks-48.png", name: "Bricks" },
  ironPlates: { category: "2Basic", order: 2, icon48: "./assets/ironPlates-48.png", name: "Iron Plates" },
  copperPlates: { category: "2Basic", order: 3, icon48: "./assets/copperPlates-48.png", name: "Copper Plates" },
  gears: { category: "2Basic", order: 4, icon48: "./assets/gears-48.png", name: "Gears" },
  copperCables: { category: "2Basic", order: 5, icon48: "./assets/copperCables-48.png", name: "Copper Cables" },
  steel: { category: "2Basic", order: 6, icon48: "./assets/steel-48.png", name: "Steel" },
  petroleumBarrel: { category: "2Basic", order: 7, icon48: "./assets/petroleumBarrel-48.png", name: "Petroleum Barrel" },
  plastics: { category: "2Basic", order: 8, icon48: "./assets/plastics-48.png", name: "Plastics" },
  sulfur: { category: "2Basic", order: 9, icon48: "./assets/sulfur-48.png", name: "Sulfur" },
  greenChips: { category: "3Advanced", order: 1, icon48: "./assets/greenChips-48.png", name: "Green Chips" },
  redChips: { category: "3Advanced", order: 2, icon48: "./assets/redChips-48.png", name: "Red Chips" },
  redScience: { category: "3Advanced", order: 3, icon48: "./assets/redScience-48.png", name: "Red Science" },
  researchPoints: { category: "4Points", order: 1, icon48: "./assets/researchPoints-48.png", name: "Research Points" },
  expansionPoints: { category: "4Points", order: 2, icon48: "./assets/expansionPoints-48.png", name: "Expansion Points" },
  alienArtefacts: { category: "4Points", order: 3, icon48: "./assets/alienArtefacts-48.png", name: "Alien Artifacts" },
  standardAmmunition:  { category: "5Military", order: 1, icon48: "./assets/standardAmmunition-48.png", name: "Standard Ammunition", density: 0.1},
  armorPenetratingAmmunition:  { category: "5Military", order: 2, icon48: "./assets/armorPenetratingAmmunition-48.png", name: "Armor Penetrating Ammunition", density: 0.1},
  piercingAmmunition:  { category: "5Military", order: 3, icon48: "./assets/piercingAmmunition-48.png", name: "Piercing Ammunition", density: 0.1},
};

window.resourceMetadata = Object.keys(resourceMetadata)
  .map(resource => ({
    name: resource,
    category: resourceMetadata[resource].category,
    order: resourceMetadata[resource].order,
    icon48: resourceMetadata[resource].icon48,
  }))
  .reduce((categories, resource) => {
    const index = categories.findIndex(cat => cat.name === resource.category);
    if (index !== -1) {
      categories[index].resources.push(resource);
    } else {
      categories.push({ name: resource.category, resources: [resource] });
    }
    return categories;
  }, [])
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(category => ({
    ...category,
    resources: category.resources.sort((a, b) => b.order - a.order),
  }))
  .reverse();

  function getResourceDensity(resourceName) {
    const density = resourceMetadata[resourceName] && resourceMetadata[resourceName].density;
    return density || 1;
  }
