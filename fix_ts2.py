import re

with open("src/lib/firebaseClient.ts", "r") as f:
    fb = f.read()

fb = fb.replace("getGroups: async () => {", "getGroups: async (): Promise<any[]> => {")
fb = fb.replace("getExpenses: async (groupId: string) => {", "getExpenses: async (groupId: string): Promise<any[]> => {")
fb = fb.replace("getContributions: async (groupId: string) => {", "getContributions: async (groupId: string): Promise<any[]> => {")
fb = fb.replace("getActivities: async () => {", "getActivities: async (): Promise<any[]> => {")
fb = fb.replace("getSession: async () => {", "getSession: async (): Promise<any> => {")

with open("src/lib/firebaseClient.ts", "w") as f:
    f.write(fb)

with open("src/pages/Index.tsx", "r") as f:
    idx = f.read()
idx = idx.replace("if (friendName) {", "if (friendName && directGroup) {")
with open("src/pages/Index.tsx", "w") as f:
    f.write(idx)

