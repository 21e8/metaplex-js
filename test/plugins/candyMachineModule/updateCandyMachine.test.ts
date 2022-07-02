import test from 'tape';
import spok, { Specifications } from 'spok';
import {
  assertThrows,
  killStuckProcess,
  metaplex,
  spokSameAmount,
  spokSameBignum,
  spokSamePubkey,
} from '../../helpers';
import { CandyMachine, sol } from '@/index';
import { createCandyMachine, createHash } from './helpers';
import { Keypair } from '@solana/web3.js';
import {
  EndSettingType,
  WhitelistMintMode,
} from '@metaplex-foundation/mpl-candy-machine';

killStuckProcess();

test('[candyMachineModule] it can update the data of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    price: sol(1),
    sellerFeeBasisPoints: 100,
    itemsAvailable: 100,
    symbol: 'OLD',
    maxEditionSupply: 0,
    isMutable: true,
    retainAuthority: true,
    goLiveDate: 1000000000,
    creators: mx.identity().publicKey,
  });

  // When we update the Candy Machine with the following data.
  const creatorA = Keypair.generate();
  const creatorB = Keypair.generate();
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      price: sol(2),
      sellerFeeBasisPoints: 200,
      itemsAvailable: 100, // <- Can only be updated with hidden settings.
      symbol: 'NEW',
      maxEditionSupply: 1,
      isMutable: false,
      retainAuthority: false,
      goLiveDate: 2000000000,
      creators: [
        { address: creatorA.publicKey, verified: false, share: 50 },
        { address: creatorB.publicKey, verified: false, share: 50 },
      ],
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    $topic: 'Updated Candy Machine',
    authorityAddress: spokSamePubkey(mx.identity().publicKey),
    price: spokSameAmount(sol(2)),
    sellerFeeBasisPoints: 200,
    itemsAvailable: 100,
    symbol: 'NEW',
    maxEditionSupply: spokSameBignum(1),
    isMutable: false,
    retainAuthority: false,
    goLiveDate: spokSameBignum(2000000000),
    creators: [
      {
        address: spokSamePubkey(creatorA.publicKey),
        verified: false,
        share: 50,
      },
      {
        address: spokSamePubkey(creatorB.publicKey),
        verified: false,
        share: 50,
      },
    ],
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the itemsAvailable of a candy machine with hidden settings', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 100,
    hiddenSettings: {
      hash: createHash('cache-file', 32),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update the items available of a Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      itemsAvailable: 200,
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.equals(updatedCandyMachine.itemsAvailable, 200);
});

test('[candyMachineModule] it can update the hidden settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with hidden settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    hiddenSettings: {
      hash: createHash('cache-file', 32),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });

  // When we update these hidden settings.
  const newHash = createHash('new-cache-file', 32);
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      hiddenSettings: {
        hash: newHash,
        name: 'new-mint-name',
        uri: 'https://example.com/new',
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: newHash,
      name: 'new-mint-name',
      uri: 'https://example.com/new',
    },
  });
});

test('[candyMachineModule] it can add hidden settings to a candy machine that have zero items available', async (t) => {
  // Given an existing Candy Machine without hidden settings and without items.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    itemsAvailable: 0,
    hiddenSettings: null,
  });

  // When we add hidden settings to the Candy Machine.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      hiddenSettings: {
        hash: createHash('cache-file', 32),
        name: 'mint-name',
        uri: 'https://example.com',
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    hiddenSettings: {
      hash: createHash('cache-file', 32),
      name: 'mint-name',
      uri: 'https://example.com',
    },
  });
});

test('[candyMachineModule] it can update the end settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with end settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    endSettings: {
      endSettingType: EndSettingType.Amount,
      number: 100,
    },
  });

  // When we update these end settings.
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      endSettings: {
        endSettingType: EndSettingType.Date,
        number: 1000000000,
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    endSettings: {
      endSettingType: EndSettingType.Date,
      number: spokSameBignum(1000000000),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the whitelist settings of a candy machine', async (t) => {
  // Given an existing Candy Machine with whitelist settings.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.BurnEveryTime,
      mint: Keypair.generate().publicKey,
      presale: true,
      discountPrice: sol(0.5),
    },
  });

  // When we update these whitelist settings.
  const newWhitelistMint = Keypair.generate().publicKey;
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      whitelistMintSettings: {
        mode: WhitelistMintMode.NeverBurn,
        mint: newWhitelistMint,
        presale: false,
        discountPrice: sol(0),
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    whitelistMintSettings: {
      mode: WhitelistMintMode.NeverBurn,
      mint: spokSamePubkey(newWhitelistMint),
      presale: false,
      discountPrice: spokSameAmount(sol(0)),
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the gatekeeper of a candy machine', async (t) => {
  // Given an existing Candy Machine with a gatekeeper.
  const mx = await metaplex();
  const { candyMachine } = await createCandyMachine(mx, {
    gatekeeper: {
      gatekeeperNetwork: Keypair.generate().publicKey,
      expireOnUse: true,
    },
  });

  // When we update the gatekeeper of the Candy Machine.
  const newGatekeeperNetwork = Keypair.generate().publicKey;
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority: mx.identity(),
      gatekeeper: {
        gatekeeperNetwork: newGatekeeperNetwork,
        expireOnUse: false,
      },
    })
    .run();

  // Then the Candy Machine has been updated properly.
  spok(t, updatedCandyMachine, {
    gatekeeper: {
      gatekeeperNetwork: spokSamePubkey(newGatekeeperNetwork),
      expireOnUse: false,
    },
  } as unknown as Specifications<CandyMachine>);
});

test('[candyMachineModule] it can update the authority of a candy machine', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine.
  const newAuthority = Keypair.generate();
  const { candyMachine: updatedCandyMachine } = await mx
    .candyMachines()
    .update(candyMachine, {
      authority,
      newAuthority: newAuthority.publicKey,
    })
    .run();

  // Then the Candy Machine has been updated properly.
  t.ok(updatedCandyMachine.authorityAddress.equals(newAuthority.publicKey));
});

test('[candyMachineModule] it cannot update the authority of a candy machine to the same authority', async (t) => {
  // Given an existing Candy Machine.
  const mx = await metaplex();
  const authority = Keypair.generate();
  const { candyMachine } = await createCandyMachine(mx, {
    authority: authority.publicKey,
  });

  // When we update the authority of the Candy Machine with the same authority.
  const promise = mx
    .candyMachines()
    .update(candyMachine, {
      authority,
      newAuthority: authority.publicKey,
    })
    .run();

  // Then we expect an error.
  await assertThrows(t, promise, /Candy Machine Already Has This Authority/);
});
