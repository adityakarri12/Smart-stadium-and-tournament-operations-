import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing data...');
  await prisma.facility.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.event.deleteMany();
  await prisma.stadium.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();

  console.log('Seeding Countries and Hierarchy...');

  // --- USA ---
  const usa = await prisma.country.create({
    data: { name: 'United States', code: 'USA' }
  });
  
  const ny = await prisma.city.create({
    data: { name: 'New York/New Jersey', countryId: usa.id }
  });
  const metlife = await prisma.stadium.create({
    data: { name: 'MetLife Stadium', capacity: 82500, cityId: ny.id }
  });

  const la = await prisma.city.create({
    data: { name: 'Los Angeles', countryId: usa.id }
  });
  const sofi = await prisma.stadium.create({
    data: { name: 'SoFi Stadium', capacity: 70000, cityId: la.id }
  });

  // --- Mexico ---
  const mex = await prisma.country.create({
    data: { name: 'Mexico', code: 'MEX' }
  });
  const mexicoCity = await prisma.city.create({
    data: { name: 'Mexico City', countryId: mex.id }
  });
  const azteca = await prisma.stadium.create({
    data: { name: 'Estadio Azteca', capacity: 87523, cityId: mexicoCity.id }
  });

  // --- Canada ---
  const can = await prisma.country.create({
    data: { name: 'Canada', code: 'CAN' }
  });
  const toronto = await prisma.city.create({
    data: { name: 'Toronto', countryId: can.id }
  });
  const bmo = await prisma.stadium.create({
    data: { name: 'BMO Field', capacity: 45000, cityId: toronto.id }
  });

  const stadiums = [metlife, sofi, azteca, bmo];
  const densities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const riskLevels = ['NORMAL', 'ELEVATED', 'SEVERE'];

  console.log('Seeding Zones, Facilities, and Events for all stadiums...');

  for (const stadium of stadiums) {
    // Determine dynamic zone count (e.g. BMO might only have 4, Azteca might have 6)
    const zoneCount = stadium.capacity > 60000 ? 6 : 4;
    const zoneNames = ['North Stand', 'South Stand', 'East Stand', 'West Stand', 'VIP Lounge', 'Fan Zone'];
    
    for (let i = 0; i < zoneCount; i++) {
      const density = densities[Math.floor(Math.random() * densities.length)];
      const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const waitTime = Math.floor(Math.random() * 25);

      const zone = await prisma.zone.create({
        data: {
          name: zoneNames[i],
          description: `The ${zoneNames[i]} of ${stadium.name}`,
          density,
          riskLevel: risk,
          waitingTime: waitTime,
          stadiumId: stadium.id
        }
      });

      // Add facilities to this zone
      await prisma.facility.createMany({
        data: [
          { name: 'Main Restrooms', type: 'RESTROOM', location: `Level 1 - ${zone.name}`, zoneId: zone.id, isOpen: true, waitingTime: Math.floor(Math.random() * 10) },
          { name: 'Burger Stand', type: 'FOOD', location: `Concourse - ${zone.name}`, zoneId: zone.id, isOpen: true, waitingTime: Math.floor(Math.random() * 15) },
          { name: 'Medical Station', type: 'MEDICAL', location: `First Aid - ${zone.name}`, zoneId: zone.id, isOpen: true, waitingTime: 0 },
          { name: 'Eco-Cup Recycling Hub', type: 'MERCHANDISE', location: `Green Station - ${zone.name}`, zoneId: zone.id, isOpen: true, waitingTime: 2 },
          { name: 'Solar Phone Charging Hub', type: 'CHARGING', location: `Tech Corner - ${zone.name}`, zoneId: zone.id, isOpen: true, waitingTime: 5 },
        ]
      });
    }

    // Add Events
    const now = new Date();
    await prisma.event.createMany({
      data: [
        { title: 'Gates Open', type: 'GATE_OPENING', description: 'Stadium gates open for early access', time: new Date(now.getTime() - 7200000), stadiumId: stadium.id },
        { title: 'Teams Warmup', type: 'KICKOFF', description: 'Teams enter the pitch', time: new Date(now.getTime() - 1800000), stadiumId: stadium.id },
        { title: 'Green Shuttle Operations', type: 'TRANSPORTATION', description: 'Zero-emission electric buses running to transit hub', time: new Date(now.getTime() - 1000000), stadiumId: stadium.id },
        { title: 'Kickoff', type: 'KICKOFF', description: 'First half begins', time: new Date(now.getTime() + 3600000), stadiumId: stadium.id },
        { title: 'Halftime Show', type: 'HALF_TIME', description: 'Live performance', time: new Date(now.getTime() + 7200000), stadiumId: stadium.id },
        { title: 'Eco-Cup Reward Program', type: 'TRANSPORTATION', description: 'Return 5 cups for public transport ticket discount', time: new Date(now.getTime() + 10000000), stadiumId: stadium.id },
      ]
    });
  }

  console.log('Seed generation complete. Multi-national structure established.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
