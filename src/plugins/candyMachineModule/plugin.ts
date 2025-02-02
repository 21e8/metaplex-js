import type { Metaplex } from '@/Metaplex';
import { MetaplexPlugin } from '@/types';
import {
  createCandyMachineOperation,
  createCandyMachineOperationHandler,
} from './createCandyMachine';
import {
  findCandyMachineByAddressOperation,
  findCandyMachineByAddressOperationHandler,
} from './findCandyMachineByAddress';
import {
  findCandyMachinesByPublicKeyFieldOperation,
  findCandyMachinesByPublicKeyFieldOnChainOperationHandler,
} from './findCandyMachinesByPublicKeyField';
import {
  insertItemsToCandyMachineOperation,
  InsertItemsToCandyMachineOperationHandler,
} from './insertItemsToCandyMachine';
import {
  updateCandyMachineOperation,
  updateCandyMachineOperationHandler,
} from './updateCandyMachine';
import { CandyMachinesClient } from './CandyMachinesClient';

export const candyMachineModule = (): MetaplexPlugin => ({
  install(metaplex: Metaplex) {
    const op = metaplex.operations();
    op.register(
      createCandyMachineOperation,
      createCandyMachineOperationHandler
    );
    op.register(
      findCandyMachineByAddressOperation,
      findCandyMachineByAddressOperationHandler
    );
    op.register(
      findCandyMachinesByPublicKeyFieldOperation,
      findCandyMachinesByPublicKeyFieldOnChainOperationHandler
    );
    op.register(
      insertItemsToCandyMachineOperation,
      InsertItemsToCandyMachineOperationHandler
    );
    op.register(
      updateCandyMachineOperation,
      updateCandyMachineOperationHandler
    );

    metaplex.candyMachines = function () {
      return new CandyMachinesClient(this);
    };
  },
});

declare module '../../Metaplex' {
  interface Metaplex {
    candyMachines(): CandyMachinesClient;
  }
}
