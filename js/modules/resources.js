const resourceMetadata = {
  stone: { category: "1Raw", order: 1, icon48: "./assets/stone-48.png", name: "Stone", density: 0.5},
  coal: { category: "1Raw", order: 2, icon48: "./assets/coal-48.png", name: "Coal", density: 0.5},
  ironOre: { category: "1Raw", order: 3, icon48: "./assets/ironOre-48.png", name: "Iron Ore", density: 0.5},
  copperOre: { category: "1Raw", order: 4, icon48: "./assets/copperOre-48.png", name: "Copper Ore", density: 0.5},
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
  researchPoints: { category: "4Points", order: 1, icon48: "./assets/researchPoints-48.png", name: "Research Points" },
  expansionPoints: { category: "4Points", order: 2, icon48: "./assets/expansionPoints-48.png", name: "Expansion Points" },
  alienArtefacts: { category: "4Points", order: 3, icon48: "./assets/alienArtefacts-48.png", name: "Alien Artifacts" },
  standardAmmunition:  { category: "5Military", order: 1, icon48: "./assets/standardAmmunition-48.png", name: "Standard Ammunition", density: 0.1},
  armorPenetratingAmmunition:  { category: "5Military", order: 2, icon48: "./assets/armorPenetratingAmmunition-48.png", name: "Armor Penetrating Ammunition", density: 0.1},
  piercingAmmunition:  { category: "5Military", order: 3, icon48: "./assets/piercingAmmunition-48.png", name: "Piercing Ammunition", density: 0.1},
  pipe: { category: "2Basic", order: 10, icon48: "./assets/pipe-48.png", name: "Pipe", density: 1 },
  engineUnit: { category: "3Advanced", order: 4, icon48: "./assets/engineUnit-48.png", name: "Engine Unit", density: 1 },
  ironRod: { category: "2Basic", order: 11, icon48: "./assets/ironRod-48.png", name: "Iron Rod", density: 1 },
  rail: { category: "2Basic", order: 12, icon48: "./assets/rail-48.png", name: "Rail", density: 1 },
  electricalEngineUnits: { category: "3Advanced", order: 5, icon48: "./assets/electricalEngineUnits-48.png", name: "Electrical Engine Units", density: 1 },
  battery: { category: "3Advanced", order: 6, icon48: "./assets/battery-48.png", name: "Battery", density: 1 },
  fuelCell: { category: "3Advanced", order: 7, icon48: "./assets/fuelCell-48.png", name: "Fuel Cell", density: 1 },
  lightDensityStructures: { category: "3Advanced", order: 8, icon48: "./assets/lightDensityStructures-48.png", name: "Light Density Structures", density: 10 },
  rocketControlUnit: { category: "3Advanced", order: 9, icon48: "./assets/rocketControlUnit-48.png", name: "Rocket Control Unit", density: 1 },
  blueChips: { category: "3Advanced", order: 10, icon48: "./assets/blueChips-48.png", name: "Blue Chips", density: 1 },
  turret: { category: "5Military", order: 4, icon48: "./assets/turret-48.png", name: "Turret", density: 1 },
  wall: { category: "5Military", order: 5, icon48: "./assets/wall-48.png", name: "Wall", density: 1 },
  redScience: { category: "7Science", order: 3, icon48: "./assets/redScience-48.png", name: "Red Science", density: 1 },
  darkScience: { category: "7Science", order: 4, icon48: "./assets/darkScience-48.png", name: "Dark Science", density: 1 },
  greenScience: { category: "7Science", order: 5, icon48: "./assets/greenScience-48.png", name: "Green Science", density: 1 },
  blueScience: { category: "7Science", order: 6, icon48: "./assets/blueScience-48.png", name: "Blue Science", density: 1 },
  purpleScience: { category: "7Science", order: 7, icon48: "./assets/purpleScience-48.png", name: "Purple Science", density: 1 },
  yellowScience: { category: "7Science", order: 8, icon48: "./assets/yellowScience-48.png", name: "Yellow Science", density: 1 },
  whiteScience: { category: "7Science", order: 9, icon48: "./assets/whiteScience-48.png", name: "White Science", density: 1 },
  rocketParts: { category: "7Science", order: 1, icon48: "./assets/rocketParts-48.png", name: "Rocket Parts", density: 1 },
  satelite: { category: "6Rocket", order: 2, icon48: "./assets/satelite-48.png", name: "Satellite", density: 1 },
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
