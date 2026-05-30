with open("src/pages/Index.tsx", "r") as f:
    idx = f.read()

target = """      const directGroup = await dbService.getOrCreateDirectGroup(friendName);
      const debtorAvatar =
        debtorName === profile.name ? profile.avatar : "🧑‍🦱";
      await dbService.addExpense(
        directGroup.id,
        `Settle: ${debtorName} paid ${creditorName}`,
        amount,
        debtorName,
        debtorAvatar,
        [creditorName]
      );"""

replacement = """      const directGroup = await dbService.getOrCreateDirectGroup(friendName);
      if (directGroup) {
        const debtorAvatar = debtorName === profile.name ? profile.avatar : "🧑‍🦱";
        await dbService.addExpense(
          directGroup.id,
          `Settle: ${debtorName} paid ${creditorName}`,
          amount,
          debtorName,
          debtorAvatar,
          [creditorName]
        );
      }"""

idx = idx.replace(target, replacement)
with open("src/pages/Index.tsx", "w") as f:
    f.write(idx)

# Fix Trips.tsx amounts
with open("src/pages/Trips.tsx", "r") as f:
    trips = f.read()
    
target2 = """                      const youOwe = exp.amount / exp.participants.length;
                      const amIPayer = exp.payer === profile.name;
                      const amIInvolved = exp.participants.includes(
                        profile.name
                      );"""
replacement2 = """                      const youOwe = (exp as any).amount / (exp as any).participants.length;
                      const amIPayer = (exp as any).payer === profile.name;
                      const amIInvolved = (exp as any).participants.includes(
                        profile.name
                      );"""
trips = trips.replace(target2, replacement2)
with open("src/pages/Trips.tsx", "w") as f:
    f.write(trips)

