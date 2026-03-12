async function lookupPostalCode(pincode, countryCode) {
    if (!pincode || !countryCode) return { success: false };

    try {
        const response = await fetch(`https://api.zippopotam.us/${countryCode.toLowerCase()}/${pincode}`);
        if (!response.ok) {
            return { success: false, message: 'Postal code not found' };
        }

        const data = await response.json();
        if (data.places && data.places.length > 0) {
            const place = data.places[0];
            return {
                city: place['place name'],
                state: place['state'],
                country: data['country'],
                success: true
            };
        }
        return { success: false, message: 'Postal code not found' };
    } catch (error) {
        return { success: false, message: 'Error fetching location data' };
    }
}

async function run() {
    console.log('US 90210:', await lookupPostalCode('90210', 'us'));
    console.log('IN 110001:', await lookupPostalCode('110001', 'in'));
    console.log('KR 48058:', await lookupPostalCode('48058', 'kr'));
}
run();
