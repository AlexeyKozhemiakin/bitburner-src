import { Company } from "../../Company/Company";
import { CompanyPosition } from "../../Company/CompanyPosition";
import { Player } from "@player";
import { scaleWorkStats, WorkStats } from "../WorkStats";
import { BitNodeMultipliers } from "../../BitNode/BitNodeMultipliers";
import { CONSTANTS } from "../../Constants";
import { Person } from "../../PersonObjects/Person";

export const calculateCompanyWorkStats = (worker: Person, company:Company, companyPosition: CompanyPosition, favor: number): WorkStats => {
  
  // If player has SF-11, calculate salary multiplier from favor
  let favorMult = 1 + favor / 100;
  if (isNaN(favorMult)) {
    favorMult = 1;
  }

  let bn11Mult = 1;
  if (Player.sourceFileLvl(11) > 0) {
    bn11Mult = favorMult;
  }

  let gains:WorkStats =  {
    money: 0,
    reputation: 0,
    hackExp: companyPosition.hackingExpGain * worker.mults.hacking_exp,
    strExp: companyPosition.strengthExpGain * worker.mults.strength_exp,
    defExp: companyPosition.defenseExpGain * worker.mults.defense_exp,
    dexExp: companyPosition.dexterityExpGain * worker.mults.dexterity_exp,
    agiExp: companyPosition.agilityExpGain * worker.mults.agility_exp,
    chaExp: companyPosition.charismaExpGain * worker.mults.charisma_exp,
    intExp: 0,
  };

  gains = scaleWorkStats(gains, company.expMultiplier * BitNodeMultipliers.CompanyWorkExpGain, false);

  gains.money = 
      companyPosition.baseSalary *
      company.salaryMultiplier *
      worker.mults.work_money *
      BitNodeMultipliers.CompanyWorkMoney *
      bn11Mult;

  let jobPerformance = companyPosition.calculateJobPerformance(
    worker.skills.hacking,
    worker.skills.strength,
    worker.skills.defense,
    worker.skills.dexterity,
    worker.skills.agility,
    worker.skills.charisma,
  );

  jobPerformance += worker.skills.intelligence / CONSTANTS.MaxSkillLevel;

  gains.reputation = jobPerformance *
      worker.mults.company_rep *
      favorMult;

  return gains;
};
