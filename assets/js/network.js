// =====================================================
// British Midland Virtual
// Network Engine v1.0
// =====================================================

async function loadNetwork() {

    const response = await fetch("assets/data/network.json");

    const network = await response.json();

    console.log("British Midland Network");

    console.table(network.destinations);

    return network;

}

loadNetwork();
