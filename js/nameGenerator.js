// Name generation utilities
function hasVowel(str) {
    return /[aeiouyAEIOUY]/.test(str);
}

// Massively Expanded Phoneme lists
const commonWordPhonemes = {
    start: [
        // Pure vowel starts
        'A', 'E', 'I', 'O', 'U', 'Ya', 'Ye', 'Yo', 'Yu', 'Ae', 'Io', 'Ou', 'Ui', 'Au', 'Ei',
        // Common Object/Concept Starts
        'Air', 'Arm', 'Box', 'Book', 'Card', 'Chair', 'Cloud', 'Desk', 'Door', 'Dust', 'Earth', 'Fire', 'Fork', 'Glass',
        'Hand', 'Head', 'Home', 'Hour', 'Key', 'Lamp', 'Leaf', 'Light', 'Line', 'Lock', 'Moon', 'Moun', 'Name', 'Page',
        'Pen', 'Pipe', 'Plan', 'Plas', 'Plate', 'Rain', 'Road', 'Rock', 'Room', 'Rope', 'Sand', 'Ship', 'Shoe', 'Sky',
        'Soap', 'Sofa', 'Star', 'Stee', 'Ston', 'Sun', 'Tab', 'Tail', 'Time', 'Tool', 'Top', 'Tree', 'Wall', 'Wat',
        'Whee', 'Wind', 'Wire', 'Wood', 'Word', 'Bell', 'Bowl', 'Brush', 'Cable', 'Chain', 'Coin', 'Comb', 'Couch', 'Cup',
        'Curtain', 'Dish', 'Drawer', 'Drum', 'Fence', 'Flag', 'Flute', 'Frame', 'Glove', 'Grain', 'Grape', 'Guard', 'Harp',
        'Hinge', 'Hole', 'Hook', 'Horn', 'Jacket', 'Jar', 'Jewel', 'Joint', 'Juice', 'Kettle', 'Kite', 'Knob', 'Lace', 'Ladder',
        'Lake', 'Lens', 'Lever', 'Lid', 'Loom', 'Loud', 'Magnet', 'Mask', 'Match', 'Metal', 'Meter', 'Mirror', 'Mist', 'Mop',
        'Mug', 'Nail', 'Net', 'Nook', 'Nut', 'Oar', 'Pad', 'Paint', 'Pan', 'Path', 'Pearl', 'Pillow', 'Pin', 'Plane',
        'Pond', 'Pool', 'Pot', 'Pouch', 'Pound', 'Pulp', 'Pump', 'Rack', 'Rail', 'Rake', 'Ramp', 'Ring', 'Rod', 'Roof',
        'Root', 'Rug', 'Ruler', 'Sack', 'Scale', 'Scoop', 'Screen', 'Seal', 'Seat', 'Shade', 'Shelf', 'Shell', 'Shield', 'Sign',
        'Slab', 'Slate', 'Sleeve', 'Slide', 'Slot', 'Smoke', 'Snare', 'Snow', 'Spade', 'Spoon', 'Spot', 'Spout', 'Spring',
        'Spool', 'Stair', 'Stamp', 'Stick', 'Stool', 'Strap', 'Straw', 'Stream', 'String', 'Strip', 'Stud', 'Swarm', 'Swing',
        'Switch', 'Table', 'Tank', 'Tape', 'Target', 'Thorn', 'Thread', 'Thumb', 'Tile', 'Tong', 'Torch', 'Tower', 'Track',
        'Train', 'Trap', 'Tray', 'Trowel', 'Trunk', 'Tube', 'Tug', 'Tune', 'Turf', 'Twine', 'Unit', 'Urn', 'Valve', 'Vase',
        'Veil', 'Vent', 'Vest', 'Vial', 'Vise', 'Wagon', 'Web', 'Wedge', 'Whale', 'Whirl', 'Wick', 'Wing', 'Wrench', 'Yoke',
        'Zest', 'Zone', 'Zorb',
        // Company Name Starts
        'Aero', 'Airb', 'Alib', 'Amaz', 'Amgen', 'Anhe', 'Astra', 'Audi', 'Baidu', 'Bayer', 'Berk', 'Black', 'Boe',
        'Canon', 'Cisco', 'Coca', 'Comc', 'Daim', 'Dell', 'Disn', 'DuPont', 'Face', 'Fid', 'Ford',
        'Gen', 'Gile', 'Goog', 'Hon', 'HP', 'Huan', 'Hyun', 'Intel', 'Master',
        'McDon', 'Merck', 'Meta', 'Micro', 'Neste', 'Nike', 'Nint', 'Oracle', 'Pana', 'Peps', 'Pfiz', 'Phil',
        'Qual', 'Riche', 'Roya', 'Sam', 'Siem', 'Spot', 'Starb', 'Suba', 'Targ', 'Tenc', 'Tes', 'Teva', 'Toyota',
        'Uber', 'Unile', 'Volks', 'Walm', 'Walt', 'Xiaom', 'Yaho', 'Yelp', 'Zara', 'Zoom', 'Zurich',
        // Country/City Name Starts
        'Aba', 'Abu', 'Accra', 'Adel', 'Addis', 'Agra', 'Algiers', 'Amman', 'Amst', 'Anka', 'Arg', 'Ashg', 'Astana', 'Ath',
        'Aus', 'Baku', 'Ban', 'Bang', 'Bei', 'Beir', 'Belg', 'Belm', 'Ber', 'Bog', 'Boha', 'Bol', 'Bra', 'Bras', 'Brat',
        'Braz', 'Bru', 'Buda', 'Bue', 'Bukh', 'Cai', 'Canb', 'Cara', 'Casab', 'Che', 'Chi', 'Copen', 'Col', 'Cona', 'Cop',
        'Coru', 'Cro', 'Daka', 'Dam', 'Dar', 'Del', 'Den', 'Dhaka', 'Doha', 'Dub', 'Edin', 'Egy', 'Eth', 'Fin', 'Fra',
        'Fuji', 'Gab', 'Gabo', 'Ger', 'Gha', 'Gree', 'Guat', 'Hano', 'Har', 'Hel', 'Ho', 'Hon', 'Hung', 'Ice', 'Ind',
        'Ira', 'Ire', 'Isr', 'Ista', 'Ita', 'Jak', 'Jam', 'Jap', 'Jeru', 'Johan', 'Jor', 'Kab', 'Kam', 'Kar', 'Kaz',
        'Ken', 'Kha', 'Kie', 'Kin', 'Kish', 'Kua', 'Kuw', 'Lag', 'Lao', 'Leb', 'Lis', 'Ljub', 'Lon', 'Los', 'Luanda',
        'Madr', 'Mal', 'Man', 'Manil', 'Mapu', 'Mex', 'Min', 'Monro', 'Monte', 'Mos', 'Mumb', 'Mus', 'Nair', 'Nass', 'Nep',
        'New', 'Nic', 'Nis', 'Nor', 'Os', 'Ott', 'Pak', 'Pal', 'Pan', 'Par', 'Peki', 'Peru', 'Phil', 'Pol', 'Port',
        'Prag', 'Pret', 'Puer', 'Qat', 'Quito', 'Rab', 'Rey', 'Riga', 'Riy', 'Rom', 'Rus', 'San', 'Sao', 'Sar', 'Sau',
        'Scot', 'Seo', 'Ser', 'Sing', 'Sko', 'Slo', 'Sof', 'Sou', 'Spa', 'Sri', 'Stoc', 'Sud', 'Swe', 'Swit', 'Syd',
        'Syr', 'Tai', 'Tan', 'Teh', 'Thai', 'Thi', 'Tir', 'Tok', 'Trip', 'Tun', 'Tur', 'Ugan', 'Ukra', 'Uni', 'Uru',
        'Val', 'Ven', 'Vie', 'Viet', 'Vil', 'War', 'Was', 'Wel', 'Wien', 'Yem', 'Zag', 'Zim'
    ].filter(hasVowel),

    middle: [
        'a', 'e', 'i', 'o', 'u', 'y', 'an', 'en', 'in', 'on', 'un', 'am', 'em', 'im', 'om', 'um',
        'ar', 'er', 'ir', 'or', 'ur', 'as', 'es', 'is', 'os', 'us', 'at', 'et', 'it', 'ot', 'ut',
        'ax', 'ex', 'ix', 'ox', 'ux', 'ay', 'ey', 'oy', 'ow', 'ou', 'ea', 'ee', 'ie', 'oa', 'oo'
    ],

    end: [
        'a', 'e', 'i', 'o', 'u', 'y', 'ah', 'al', 'an', 'ar', 'as', 'at', 'ay', 'el', 'en', 'er',
        'es', 'et', 'il', 'in', 'ir', 'is', 'it', 'ol', 'on', 'or', 'os', 'ot', 'ul', 'un', 'ur',
        'us', 'ut', 'ice', 'ide', 'ile', 'ine', 'ing', 'ion', 'ive', 'ize', 'ode', 'oke', 'ole',
        'ome', 'one', 'ore', 'ose', 'ote', 'ove', 'owl', 'own', 'ule', 'une', 'ure'
    ].filter(hasVowel)
};

function randomFrom(array) {
    if (array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
}

function buildName(phonemes, syllables = 3) {
    let name = '';
    if (syllables <= 0) return '';

    // Always start with a 'start' phoneme
    name += randomFrom(phonemes.start);

    // Add 'middle' phonemes for intermediate syllables
    for (let i = 1; i < syllables - 1; i++) {
        name += randomFrom(phonemes.middle);
        // 20% chance to repeat a middle phoneme
        if (Math.random() < 0.2 && i < syllables - 2) {
            name += randomFrom(phonemes.middle);
        }
    }

    // End with an 'end' phoneme for the last syllable, if more than 1 syllable
    if (syllables > 1) {
        name += randomFrom(phonemes.end);
    }

    // Capitalize the first letter of the generated name
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function generateAgentName() {
    let firstName, lastName;
    const MAX_COMBINED_LENGTH = 9; // Maximum total characters excluding the space
    const MIN_COMBINED_LENGTH = 5; // Minimum total characters excluding the space

    do {
        // Randomly choose 1 or 2 syllables for the first name
        const firstSyllables = Math.floor(Math.random() * 2) + 1; // Generates 1 or 2
        // Randomly choose 1 or 2 syllables for the last name
        const lastSyllables = Math.floor(Math.random() * 2) + 1; // Generates 1 or 2

        firstName = buildName(commonWordPhonemes, firstSyllables);
        lastName = buildName(commonWordPhonemes, lastSyllables);

    } while (firstName.length + lastName.length > MAX_COMBINED_LENGTH ||
             firstName.length + lastName.length < MIN_COMBINED_LENGTH ||
             !hasVowel(firstName) || !hasVowel(lastName));

    return `${firstName} ${lastName}`;
}