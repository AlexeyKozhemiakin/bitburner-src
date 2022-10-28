import { Generic_fromJSON, Generic_toJSON, IReviverValue, Reviver } from "../../../utils/JSONReviver";
import { Sleeve } from "../Sleeve";
import { Player} from "@player";

import { applySleeveGains, Work, WorkType } from "./Work";
import { LocationName } from "../../../Locations/data/LocationNames";
import { Companies } from "../../../Company/Companies";
import { Company } from "../../../Company/Company";
import { CompanyPosition } from "../../../Company/CompanyPosition";
import { CompanyPositions } from "../../../Company/CompanyPositions";

import { calculateCompanyWorkStats } from "../../../Work/formulas/Company";
import { WorkStats } from "../../../Work/WorkStats";
import { influenceStockThroughCompanyWork } from "../../../StockMarket/PlayerInfluencing";

interface SleeveCompanyWorkParams {
  companyName: string;
}

export const isSleeveCompanyWork = (w: Work | null): w is SleeveCompanyWork =>
  w !== null && w.type === WorkType.COMPANY;

export class SleeveCompanyWork extends Work {
  companyName: string;

  constructor(params?: SleeveCompanyWorkParams) {
    super(WorkType.COMPANY);
    this.companyName = params?.companyName ?? LocationName.NewTokyoNoodleBar;
  }

  getCompany(): Company {
    const c = Companies[this.companyName];
    if (!c) throw new Error(`Company not found: '${this.companyName}'`);
    return c;
  }

  getPosition(): CompanyPosition {
    const companyPositionName = Player.jobs[this.getCompany().name];
    const companyPosition = CompanyPositions[companyPositionName];

    if (!companyPosition) throw new Error(`Company Position not found: '${companyPositionName}'`);
    return companyPosition;
  }

  getGainRates(sleeve: Sleeve): WorkStats {
    return calculateCompanyWorkStats(sleeve, this.getCompany(), this.getPosition(), this.getCompany().favor);
  }

  process(sleeve: Sleeve, cycles: number): number {
    const company = this.getCompany();
    const gains = this.getGainRates(sleeve);
    applySleeveGains(sleeve, gains, cycles);
    company.playerReputation += gains.reputation * cycles;
    influenceStockThroughCompanyWork(company, gains.reputation, cycles);
    return 0;
  }

  APICopy(): Record<string, unknown> {
    return {
      type: this.type,
      companyName: this.companyName,
    };
  }

  /** Serialize the current object to a JSON save state. */
  toJSON(): IReviverValue {
    return Generic_toJSON("SleeveCompanyWork", this);
  }

  /** Initializes a CompanyWork object from a JSON save state. */
  static fromJSON(value: IReviverValue): SleeveCompanyWork {
    return Generic_fromJSON(SleeveCompanyWork, value.data);
  }
}

Reviver.constructors.SleeveCompanyWork = SleeveCompanyWork;
