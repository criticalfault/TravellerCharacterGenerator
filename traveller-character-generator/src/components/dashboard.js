import * as React from 'react';

export default function Dashboard(props) {

    const RollMethods = ['2d6','3d6 drop the lowest'];
    const [Character, setCharacter] = React.useState(
        {
            "Age":18,
            "AgingEvents":[],
            "Injuries":[],
            "Strength":0,
            "Dexterity":0,
            "Endurance":0,
            "Intellect":0,
            "Education":0,
            "Social":0,
            "Psi":0,
            "Skills":[],
            "LifeEvents":[],
            "Rivals":[],
            "Allies":[],
            "Cash":0,
            "Terms":[],
            "Careers":[],
            "BenefitRolls":[],
            "Benefits":[],
            "Species":"",
            "Name":"",
            "RollMethod":"2d6",
            "Gender":"M",
        }
    );

    return (<>
            </>);

}

