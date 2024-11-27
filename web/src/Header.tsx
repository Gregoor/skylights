export async function Header() {
  const agent = await getSessionAgent(false);
  const profile = await agent?.getProfile({ actor: agent.did! });
  if (!profile) return null;
  return (
    <>
      <AvatarLink
        className="hidden sm:block absolute right-3"
        profile={profile.data}
        style={{ top: 13 }}
      />
      <div className="mt-4 flex sm:hidden justify-center items-center">
        <AvatarLink profile={profile.data} />
      </div>
    </>
  );
}
