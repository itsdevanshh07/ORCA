package com.example.demo;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PatchCacheManagerTest {
    @Test void missingKeyReturnsNull() { assertNull(new PatchCacheManager().getCachedPatch("drift")); }
    @Test void savesAndRetrievesPatch() { PatchCacheManager cache = new PatchCacheManager(); cache.savePatch("drift", "{}"); assertEquals("{}", cache.getCachedPatch("drift")); }
    @Test void invalidationRemovesPatch() { PatchCacheManager cache = new PatchCacheManager(); cache.savePatch("drift", "{}"); cache.invalidatePatch("drift"); assertNull(cache.getCachedPatch("drift")); }
}
