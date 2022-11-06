#if defined _TEST_INC_
	#endinput
#endif
#define _TEST_INC_

#include <sourcemod>
#include <profiler>

// Testing to make sure the setup-sp include path works properly

stock void Test()
{
	Profiler prof = new Profiler();
	prof.Start();
	PrintToServer("Hello World");
	prof.Stop();
	PrintToServer("Time: %f", prof.Time);
	delete prof;
}
