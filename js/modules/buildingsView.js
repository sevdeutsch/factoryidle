var form = document.querySelector('#supplyChainForm form');
var resourceSelect = form.querySelector('#resource');
var allResources = [];

buildings.forEach(building => {
  Object.keys(building.outputs).forEach(resource => {
    if (!allResources.includes(resource)) {
      allResources.push(resource);
    }
  });
});

allResources.forEach(resource => {
  var option = document.createElement('option');
  option.textContent = resource;
  resourceSelect.appendChild(option);
});

form.addEventListener('submit', function(event) {
  event.preventDefault();
  var resource = resourceSelect.value;
  var amount = form.querySelector('#amount').value;
  var supplyChain = calculateSupplyChain(resource, amount);
  var supplyChainDiv = document.querySelector('#supplyChainList');
  while (supplyChainDiv.firstChild) {
    supplyChainDiv.removeChild(supplyChainDiv.firstChild);
  }
  supplyChainDiv.appendChild(createSupplyChainList(supplyChain));

  var buildingTableDiv = document.querySelector('#buildingTable');
  while (buildingTableDiv.firstChild) {
    buildingTableDiv.removeChild(buildingTableDiv.firstChild);
  }
  var totalBuildings = createTableFromCalculation(calculateTotalBuildings(supplyChain));
  buildingTableDiv.appendChild(totalBuildings);
});

function fixPrecision(num) {
  const decimalPart = num.toString().split('.')[1];
  if (!decimalPart) return num;

  let precision = 0;
  for (let i = 0; i < decimalPart.length; i++) {
    if (decimalPart[i] !== '0') {
      precision = i + 1; // plus 1 because we start counting from 0
      break;
    }
  }

  return parseFloat(num.toFixed(precision));
}

function calculateTotalBuildings(supplyChain) {
  // Object to hold the total buildings needed
  var totalBuildings = {};

  function addBuilding(buildingObj) {
    var building = buildingObj.building;
    var cycles = buildingObj.cycles;
    if (!totalBuildings[building]) {
      totalBuildings[building] = { cycles: 0 };
    }
    totalBuildings[building].cycles += cycles;
  }

  function recurse(chain) {
    addBuilding(chain[0]); // Add the first building in the chain

    // Go through the rest of the array and recurse if it's an array
    for (let i = 1; i < chain.length; i++) {
      if (Array.isArray(chain[i])) {
        recurse(chain[i]);
      }
    }
  }

  recurse(supplyChain);

  return totalBuildings;
}

function createTableFromCalculation(calculation) {
  var table = document.createElement('table');
  var tbody = document.createElement('tbody');

  for (var building in calculation) {
    var tr = document.createElement('tr');
    var tdBuilding = document.createElement('td');
    var tdTotal = document.createElement('td');

    tdBuilding.textContent = building;
    tdTotal.textContent = fixPrecision(calculation[building].cycles);

    tr.appendChild(tdBuilding);
    tr.appendChild(tdTotal);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  // Append the table to the body (or wherever you want to display it)
  return table;
}


function createSupplyChainList(supplyChain) {
  var ul = document.createElement('ul');

  // Create an 'li' for the building itself (first element of the array)
  var li = document.createElement('li');
  li.textContent = `${supplyChain[0].building}, (${supplyChain[0].cycles})`;
  li.classList.add('building-li');
  li.dataset.buildingName = supplyChain[0].building;
  li.dataset.cycles = supplyChain[0].cycles;
  ul.appendChild(li);

  // Go through the rest of the array and create nested lists for inputs
  for (let i = 1; i < supplyChain.length; i++) {
    if (Array.isArray(supplyChain[i])) {
      li.appendChild(createSupplyChainList(supplyChain[i]));
    }
  }

  li.addEventListener('click', function(event) {
    var isSelected = li.classList.contains('selected');
    var isMac = window.navigator.platform.includes('Mac');
    var isModifierKeyPressed = isMac ? event.metaKey : event.ctrlKey;

    if (!isModifierKeyPressed) {
      document.querySelectorAll('.selected, .selected-child').forEach(el => {
        el.classList.remove('selected', 'selected-child');
      });
    }

    li.classList.toggle('selected', !isSelected);
    Array.from(li.querySelectorAll('li')).forEach(child => {
      child.classList.toggle('selected-child', !isSelected);
    });

    var selectedLis = Array.from(document.querySelectorAll('.selected:not(.selected-child)'));
    var buildingTableDiv = document.querySelector('#buildingTable');

    while (buildingTableDiv.firstChild) {
      buildingTableDiv.removeChild(buildingTableDiv.firstChild);
    }

    var totalBuildingsAll = {};

    selectedLis.forEach(li => {
      var buildingName = li.dataset.buildingName;
      var cycles = parseFloat(li.dataset.cycles, 10);
      var outputs = buildings.find(b => b.name === buildingName).outputs;

      var selectedSupplyChain = calculateSupplyChain(Object.keys(outputs)[0], Object.values(outputs)[0] * cycles)
      var totalBuildings = calculateTotalBuildings(selectedSupplyChain);

      // Sum up the total buildings
      for (let building in totalBuildings) {
        if (!totalBuildingsAll[building]) {
          totalBuildingsAll[building] = { cycles: 0 };
        }
        totalBuildingsAll[building].cycles += totalBuildings[building].cycles;
      }
    });

    var totalBuildingsTable = createTableFromCalculation(totalBuildingsAll);
    buildingTableDiv.appendChild(totalBuildingsTable);

    event.stopPropagation();
  });

  return ul;
}


function calculateSupplyChain(resource, amount) {
  var building = buildings.find(b => b.outputs[resource]);

  if (!building) return [];

  var producedAmount = fixPrecision(building.outputs[resource] * building.rate);

  var cyclesNeeded = fixPrecision(amount / producedAmount);

  var inputs = Object.keys(building.inputs).reduce((acc, inputResource) => {
    acc[inputResource] = fixPrecision(building.inputs[inputResource] * cyclesNeeded);
    return acc;
  }, {});

  var supplyChain = Object.keys(inputs).map(inputResource => {
    return calculateSupplyChain(inputResource, inputs[inputResource]);
  });

  supplyChain.unshift({
    building: building.name,
    cycles: cyclesNeeded,
    inputs: inputs
  });

  return supplyChain;
}
