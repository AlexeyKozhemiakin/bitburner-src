import { BitNodeMultipliers } from "../../BitNode/BitNodeMultipliers";
import { Crime } from "src/Crime/Crime";
import { newWorkStats, scaleWorkStats, WorkStats } from "../WorkStats";
import { Person } from "../../PersonObjects/Person";

export const calculateCrimeWorkStats = (person:Person, crime: Crime): WorkStats => {
  const gains = scaleWorkStats(
    newWorkStats({
      money: crime.money * person.mults.crime_money,
      hackExp: crime.hacking_exp * 2 * person.mults.hacking_exp,
      strExp: crime.strength_exp * 2 * person.mults.strength_exp,
      defExp: crime.defense_exp * 2 * person.mults.defense_exp,
      dexExp: crime.dexterity_exp * 2 * person.mults.dexterity_exp,
      agiExp: crime.agility_exp * 2 * person.mults.agility_exp,
      chaExp: crime.charisma_exp * 2 * person.mults.charisma_exp,
      intExp: crime.intelligence_exp * 2,
    }),
    BitNodeMultipliers.CrimeExpGain,
    false,
  );
  gains.money *= BitNodeMultipliers.CrimeMoney;
  return gains;
};
