with open("src/lib/supabaseClient.ts", "r") as f:
    content = f.read()

target = """  getOrCreateDirectGroup: async (friendName: string) => {
    const db = getLocalDb();
    const myName = db.profile.name;
    const directGroupName = `Direct: ${friendName}`;
    
    // Find existing direct group with this friend
    let group = db.groups.find(g => 
      g.name === directGroupName && 
      g.mode === "split" && 
      g.members.includes(myName) && 
      g.members.includes(friendName) &&
      g.members.length === 2
    );

    if (!group) {
      group = {
        id: "g_" + Math.random().toString(36).substr(2, 9),
        name: directGroupName,
        mode: "split",
        members: [myName, friendName],
        emoji: "👤",
        created_at: new Date().toISOString(),
      };
      db.groups.push(group);
      saveLocalDb(db);
    }
    
    return group;
  },"""
content = content.replace(target, "")

with open("src/lib/supabaseClient.ts", "w") as f:
    f.write(content)
