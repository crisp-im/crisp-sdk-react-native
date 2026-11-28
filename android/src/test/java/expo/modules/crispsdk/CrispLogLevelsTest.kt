package expo.modules.crispsdk

import android.util.Log
import org.junit.Assert.assertEquals
import org.junit.Test

class CrispLogLevelsTest {
  @Test
  fun `maps JS levels to Android priorities and back`() {
    val priorities = listOf(Log.VERBOSE, Log.DEBUG, Log.INFO, Log.WARN, Log.ERROR, Log.ASSERT)
    priorities.forEachIndexed { level, priority ->
      assertEquals(priority, CrispLogLevels.toPriority(level))
      assertEquals(level, CrispLogLevels.fromPriority(priority))
    }
  }

  @Test
  fun `falls back to warn and clamps unknown values`() {
    assertEquals(Log.WARN, CrispLogLevels.toPriority(-1))
    assertEquals(Log.WARN, CrispLogLevels.toPriority(6))
    assertEquals(0, CrispLogLevels.fromPriority(0))
    assertEquals(5, CrispLogLevels.fromPriority(99))
  }
}
